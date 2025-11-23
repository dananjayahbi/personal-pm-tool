import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { saveImageToCache, removeImageFromCache } from "@/lib/utils/imageEngine";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify subtask belongs to user
    const subTask = await prisma.subTask.findFirst({
      where: {
        id,
        task: {
          project: {
            userId: user.id,
          },
        },
      },
    });

    if (!subTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Update subtask (isCompleted or order)
    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: {
        ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

    return NextResponse.json({ subTask: updatedSubTask });
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, description } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Subtask title is required" },
        { status: 400 }
      );
    }

    // Verify subtask belongs to user
    const subTask = await prisma.subTask.findFirst({
      where: {
        id,
        task: {
          project: {
            userId: user.id,
          },
        },
      },
      include: {
        images: true,
      },
    });

    if (!subTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Extract embedded images from new HTML description
    console.log('=== PUT SUBTASK - START ===');
    console.log('1. Subtask ID:', id);
    console.log('2. Original description from request:', description?.substring(0, 300));
    
    const newImages = new Map<string, { filename: string; base64Data: string; mimeType: string; imageId?: string }>();
    const existingImageIds = new Set<string>();
    let processedDescription = description?.trim() || null;
    
    if (processedDescription) {
      // First, collect existing images by their IDs from data-image-id attributes
      const existingImgRegex = /<img[^>]+data-image-id="([^"]+)"[^>]*>/g;
      let existingMatch;
      
      while ((existingMatch = existingImgRegex.exec(processedDescription)) !== null) {
        const imageId = existingMatch[1];
        existingImageIds.add(imageId);
        console.log('3. Found existing image ID:', imageId);
      }
      
      console.log('4. Total existing images:', existingImageIds.size);
      
      // Then, find new images (those with base64 data but no image ID)
      const newImgRegex = /<img(?![^>]*data-image-id)[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
      let newMatch;
      let imageIndex = 1;
      
      while ((newMatch = newImgRegex.exec(processedDescription)) !== null) {
        const mimeType = newMatch[1];
        const base64Data = newMatch[2];
        const extension = mimeType.split('/')[1] || 'png';
        const imageSource = `data:${mimeType};base64,${base64Data}`;
        
        console.log(`5. Found NEW image ${imageIndex}:`, {
          mimeType,
          base64Length: base64Data.length,
          extension
        });
        
        newImages.set(imageSource, {
          filename: `image-${imageIndex}.${extension}`,
          base64Data,
          mimeType,
        });
        
        imageIndex++;
      }
      
      console.log('6. Total new images:', newImages.size);
      
      // Remove all new images (with base64) and replace with placeholders
      // Keep existing images (with data-image-id) as-is, but remove src attributes
      if (newImages.size > 0) {
        processedDescription = processedDescription.replace(
          /<img(?![^>]*data-image-id)[^>]+src="data:[^"]*"[^>]*>/gi, 
          '<!--IMAGE_PLACEHOLDER-->'
        );
        console.log('7. Description after new image placeholder replacement:', processedDescription?.substring(0, 300));
      }
      
      // Remove src attributes from existing images (keep only data-image-id)
      processedDescription = processedDescription.replace(
        /<img([^>]*data-image-id="[^"]+")([^>]*)>/g,
        (match: string, idPart: string, rest: string) => {
          // Remove src attribute if present
          const cleanedRest = rest.replace(/\s*src="[^"]*"\s*/g, ' ');
          console.log('8. Removing src from existing image:', idPart);
          return `<img${idPart}${cleanedRest}>`;
        }
      );
      
      console.log('9. Final processed description:', processedDescription?.substring(0, 300));
    }

    // Find images to delete (images in DB that are not referenced by ID)
    const imagesToDelete = subTask.images.filter(img => !existingImageIds.has(img.id));
    
    console.log('10. Images to delete:', imagesToDelete.map(img => img.id));

    // Delete removed images
    if (imagesToDelete.length > 0) {
      await prisma.subTaskImage.deleteMany({
        where: {
          id: { in: imagesToDelete.map(img => img.id) },
        },
      });

      // Remove from cache
      imagesToDelete.forEach((image) => {
        removeImageFromCache(image.id);
        console.log('11. Deleted image from cache:', image.id);
      });
    }

    // Get current max order for new images
    const remainingImages = subTask.images.filter(img => !imagesToDelete.includes(img));
    const maxOrder = remainingImages.length > 0 
      ? Math.max(...remainingImages.map(img => img.order))
      : 0;

    // Update subtask and add new images if found
    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: {
        title: title.trim(),
        description: processedDescription, // Will be updated with image IDs below
        ...(newImages.size > 0 && {
          images: {
            create: Array.from(newImages.values()).map((img, index) => ({
              filename: img.filename,
              base64Data: img.base64Data,
              mimeType: img.mimeType,
              order: maxOrder + index + 1,
            })),
          },
        }),
      },
      include: {
        images: true,
      },
    });

    // Replace base64 data URLs with image IDs in the description for newly added images
    if (newImages.size > 0 && processedDescription) {
      console.log('12. Replacing placeholders with new image IDs...');
      let updatedDescription = processedDescription;
      const newlyCreatedImages = updatedSubTask.images
        .filter(img => !existingImageIds.has(img.id))
        .sort((a, b) => a.order - b.order);
      
      console.log('13. Newly created images:', newlyCreatedImages.map(img => img.id));
      
      newlyCreatedImages.forEach((image, index) => {
        console.log(`14. Replacing placeholder ${index + 1} with image ID:`, image.id);
        // Replace the first placeholder with an img tag that has only the image ID (no src)
        updatedDescription = updatedDescription.replace(
          '<!--IMAGE_PLACEHOLDER-->',
          `<img data-image-id="${image.id}" alt="${image.filename}" class="rounded-lg max-w-full h-auto" />`
        );
      });
      
      console.log('15. Final description to save:', updatedDescription);
      
      // Update the subtask with the new description containing image IDs
      await prisma.subTask.update({
        where: { id: updatedSubTask.id },
        data: { description: updatedDescription },
      });
      
      updatedSubTask.description = updatedDescription;
    } else if (processedDescription && processedDescription !== updatedSubTask.description) {
      console.log('16. No new images, but description changed (likely removed src from existing)');
      console.log('17. Updating description to:', processedDescription);
      
      // If no new images but description changed (e.g., removed src from existing images)
      await prisma.subTask.update({
        where: { id: updatedSubTask.id },
        data: { description: processedDescription },
      });
      
      updatedSubTask.description = processedDescription;
    }

    // Cache all images (existing and new)
    if (updatedSubTask.images && updatedSubTask.images.length > 0) {
      console.log('18. Caching images...');
      updatedSubTask.images.forEach((image) => {
        saveImageToCache(image.id, image.base64Data, image.mimeType, image.filename);
        console.log('19. Cached image:', image.id);
      });
    }
    
    console.log('=== PUT SUBTASK - END ===\n');

    return NextResponse.json({ subTask: updatedSubTask });
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify subtask belongs to user
    const subTask = await prisma.subTask.findFirst({
      where: {
        id,
        task: {
          project: {
            userId: user.id,
          },
        },
      },
    });

    if (!subTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Get all images before deleting
    const images = await prisma.subTaskImage.findMany({
      where: { subTaskId: id },
      select: { id: true },
    });

    // Delete subtask (cascade will delete images)
    await prisma.subTask.delete({
      where: { id },
    });

    // Remove images from cache
    images.forEach((image) => {
      removeImageFromCache(image.id);
    });

    return NextResponse.json({ message: "Subtask deleted successfully" });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
}
