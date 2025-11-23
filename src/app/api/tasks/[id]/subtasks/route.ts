import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getImageFromCache, saveImageToCache } from "@/lib/utils/imageEngine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId: user.id,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch subtasks without images first (for performance)
    const subTasks = await prisma.subTask.findMany({
      where: { taskId: id },
      orderBy: { order: "asc" },
      include: {
        images: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    // Add base64 data from cache or database
    const subTasksWithImages = await Promise.all(
      subTasks.map(async (subTask) => {
        if (subTask.images.length === 0) {
          return subTask;
        }

        const imagesWithData = await Promise.all(
          subTask.images.map(async (image) => {
            // Try to get from cache first
            let cachedImage = getImageFromCache(image.id);
            
            if (cachedImage) {
              return {
                ...image,
                base64Data: cachedImage.base64Data,
              };
            }

            // If not in cache, fetch from database
            const fullImage = await prisma.subTaskImage.findUnique({
              where: { id: image.id },
              select: { base64Data: true },
            });

            if (fullImage) {
              // Save to cache for next time
              saveImageToCache(image.id, fullImage.base64Data, image.mimeType, image.filename);
              
              return {
                ...image,
                base64Data: fullImage.base64Data,
              };
            }

            return image;
          })
        );

        return {
          ...subTask,
          images: imagesWithData,
        };
      })
    );

    return NextResponse.json({ subTasks: subTasksWithImages });
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        project: {
          userId: user.id,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get the highest order number
    const lastSubTask = await prisma.subTask.findFirst({
      where: { taskId: id },
      orderBy: { order: "desc" },
    });

    const newOrder = (lastSubTask?.order || 0) + 1;

    // Extract embedded images from HTML description
    const extractedImages: Array<{ filename: string; base64Data: string; mimeType: string }> = [];
    let cleanedDescription = description?.trim() || null;
    
    if (cleanedDescription) {
      const imgRegex = /<img[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
      let match;
      let imageIndex = 1;
      
      while ((match = imgRegex.exec(cleanedDescription)) !== null) {
        const mimeType = match[1];
        const base64Data = match[2];
        const extension = mimeType.split('/')[1] || 'png';
        
        extractedImages.push({
          filename: `image-${imageIndex}.${extension}`,
          base64Data,
          mimeType,
        });
        
        imageIndex++;
      }
      
      // Remove img tags from description after extracting them
      // This prevents duplication and ensures images are only in SubTaskImage table
      if (extractedImages.length > 0) {
        cleanedDescription = cleanedDescription.replace(/<img[^>]*>/gi, '').trim() || null;
      }
    }

    // Create subtask with images if found
    const subTask = await prisma.subTask.create({
      data: {
        title: title.trim(),
        description: cleanedDescription,
        taskId: id,
        order: newOrder,
        ...(extractedImages.length > 0 && {
          images: {
            create: extractedImages.map((img, index) => ({
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

    // Cache the images
    if (subTask.images && subTask.images.length > 0) {
      subTask.images.forEach((image) => {
        saveImageToCache(image.id, image.base64Data, image.mimeType, image.filename);
      });
    }

    return NextResponse.json({ subTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
