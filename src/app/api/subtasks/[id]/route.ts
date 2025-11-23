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
    const { title, description, images, deletedImageIds } = await request.json();

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
    });

    if (!subTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Delete specified images
    if (deletedImageIds && deletedImageIds.length > 0) {
      await prisma.subTaskImage.deleteMany({
        where: {
          id: { in: deletedImageIds },
          subTaskId: id,
        },
      });

      // Remove from cache
      deletedImageIds.forEach((imageId: string) => {
        removeImageFromCache(imageId);
      });
    }

    // Update subtask and add new images if provided
    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        ...(images && images.length > 0 && {
          images: {
            create: images.map((img: any, index: number) => ({
              filename: img.filename,
              base64Data: img.base64Data,
              mimeType: img.mimeType,
              order: index + 1,
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
