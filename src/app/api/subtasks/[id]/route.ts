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
    const newImageSources = new Set<string>();
    const extractedImages: Array<{ filename: string; base64Data: string; mimeType: string }> = [];
    
    if (description) {
      const imgRegex = /<img[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
      let match;
      let imageIndex = 1;
      
      while ((match = imgRegex.exec(description)) !== null) {
        const mimeType = match[1];
        const base64Data = match[2];
        const extension = mimeType.split('/')[1] || 'png';
        const imageSource = `data:${mimeType};base64,${base64Data}`;
        
        newImageSources.add(imageSource);
        
        // Check if this image already exists in the database
        const existingImage = subTask.images.find(img => 
          `data:${img.mimeType};base64,${img.base64Data}` === imageSource
        );
        
        if (!existingImage) {
          extractedImages.push({
            filename: `image-${imageIndex}.${extension}`,
            base64Data,
            mimeType,
          });
        }
        
        imageIndex++;
      }
    }

    // Find images to delete (images in DB that are no longer in HTML)
    const imagesToDelete = subTask.images.filter(img => {
      const imageSource = `data:${img.mimeType};base64,${img.base64Data}`;
      return !newImageSources.has(imageSource);
    });

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
    const maxOrder = subTask.images.length > 0 
      ? Math.max(...subTask.images.map(img => img.order))
      : 0;

    // Update subtask and add new images if found
    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ...(extractedImages.length > 0 && {
          images: {
            create: extractedImages.map((img, index) => ({
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

    // Cache new images
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
