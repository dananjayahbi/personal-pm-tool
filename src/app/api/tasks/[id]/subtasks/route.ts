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

    // Add base64 data from cache or database and inject into description HTML
    const subTasksWithImages = await Promise.all(
      subTasks.map(async (subTask) => {
        if (subTask.images.length === 0) {
          return subTask;
        }

        // Fetch base64 data for all images
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

        // Replace data-image-id attributes in description with actual base64 data
        let descriptionWithImages = subTask.description;
        
        if (descriptionWithImages && imagesWithData.length > 0) {
          imagesWithData.forEach((image) => {
            if ('base64Data' in image && image.base64Data) {
              const imgRegex = new RegExp(
                `<img([^>]*)data-image-id="${image.id}"([^>]*)>`,
                'g'
              );
              const dataUrl = `data:${image.mimeType};base64,${image.base64Data}`;
              
              descriptionWithImages = descriptionWithImages!.replace(
                imgRegex,
                `<img$1src="${dataUrl}"$2 data-image-id="${image.id}">`
              );
            }
          });
        }

        return {
          ...subTask,
          description: descriptionWithImages,
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
    let processedDescription = description?.trim() || null;
    
    if (processedDescription) {
      const imgRegex = /<img[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
      let match;
      let imageIndex = 1;
      
      while ((match = imgRegex.exec(processedDescription)) !== null) {
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
      
      // Don't remove img tags - keep them as placeholders
      // We'll replace base64 data with image IDs after creation
    }

    // Create subtask with images if found
    const subTask = await prisma.subTask.create({
      data: {
        title: title.trim(),
        description: processedDescription, // Will be updated with image IDs below
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

    // Replace base64 data URLs with image IDs in the description
    if (subTask.images && subTask.images.length > 0 && processedDescription) {
      let updatedDescription = processedDescription;
      const sortedImages = subTask.images.sort((a, b) => a.order - b.order);
      
      sortedImages.forEach((image) => {
        // Find and replace the first base64 img tag with one that includes the image ID
        const imgRegex = /<img[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/;
        updatedDescription = updatedDescription.replace(imgRegex, (match: string) => {
          // Add data-image-id attribute to the img tag
          return match.replace(/<img/, `<img data-image-id="${image.id}"`);
        });
      });
      
      // Update the subtask with the new description containing image IDs
      await prisma.subTask.update({
        where: { id: subTask.id },
        data: { description: updatedDescription },
      });
      
      subTask.description = updatedDescription;
    }

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
