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
      }
      
      // Then, find new images (those with base64 data but no image ID)
      const newImgRegex = /<img(?![^>]*data-image-id)[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
      let newMatch;
      let imageIndex = 1;
      
      while ((newMatch = newImgRegex.exec(processedDescription)) !== null) {
        const mimeType = newMatch[1];
        const base64Data = newMatch[2];
        const extension = mimeType.split('/')[1] || 'png';
        const imageSource = `data:${mimeType};base64,${base64Data}`;
        
        newImages.set(imageSource, {
          filename: `image-${imageIndex}.${extension}`,
          base64Data,
          mimeType,
        });
        
        imageIndex++;
      }
    }

    // Find images to delete (images in DB that are not referenced by ID)
    const imagesToDelete = subTask.images.filter(img => !existingImageIds.has(img.id));

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
      let updatedDescription = processedDescription;
      const newlyCreatedImages = updatedSubTask.images
        .filter(img => !existingImageIds.has(img.id))
        .sort((a, b) => a.order - b.order);
      
      newlyCreatedImages.forEach((image) => {
        // Find and replace the first base64 img tag (without data-image-id) with one that includes the image ID
        const imgRegex = /<img(?![^>]*data-image-id)[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/;
        updatedDescription = updatedDescription.replace(imgRegex, (match: string) => {
          // Add data-image-id attribute to the img tag
          return match.replace(/<img/, `<img data-image-id="${image.id}"`);
        });
      });
      
      // Update the subtask with the new description containing image IDs
      await prisma.subTask.update({
        where: { id: updatedSubTask.id },
        data: { description: updatedDescription },
      });
      
      updatedSubTask.description = updatedDescription;
    }

    // Cache all images (existing and new)
    if (updatedSubTask.images && updatedSubTask.images.length > 0) {
      updatedSubTask.images.forEach((image) => {
        saveImageToCache(image.id, image.base64Data, image.mimeType, image.filename);
      });
    }

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
