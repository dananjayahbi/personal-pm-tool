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
    console.log('=== GET SUBTASKS - START ===');
    console.log('1. Found', subTasks.length, 'subtasks');
    
    const subTasksWithImages = await Promise.all(
      subTasks.map(async (subTask, index) => {
        console.log(`\n--- Processing SubTask ${index + 1} (ID: ${subTask.id}) ---`);
        console.log('2. Original description from DB:', subTask.description?.substring(0, 300));
        console.log('3. Image count:', subTask.images.length);
        
        if (subTask.images.length === 0) {
          console.log('4. No images, returning as-is');
          return subTask;
        }

        // Fetch base64 data for all images
        const imagesWithData = await Promise.all(
          subTask.images.map(async (image, imgIndex) => {
            console.log(`  5.${imgIndex + 1}. Fetching image ${image.id}...`);
            
            // Try to get from cache first
            let cachedImage = getImageFromCache(image.id);
            
            if (cachedImage) {
              console.log(`  6.${imgIndex + 1}. Found in cache, base64 length:`, cachedImage.base64Data.length);
              return {
                ...image,
                base64Data: cachedImage.base64Data,
              };
            }

            console.log(`  7.${imgIndex + 1}. Not in cache, fetching from DB...`);
            // If not in cache, fetch from database
            const fullImage = await prisma.subTaskImage.findUnique({
              where: { id: image.id },
              select: { base64Data: true },
            });

            if (fullImage) {
              console.log(`  8.${imgIndex + 1}. Found in DB, caching now...`);
              // Save to cache for next time
              saveImageToCache(image.id, fullImage.base64Data, image.mimeType, image.filename);
              
              return {
                ...image,
                base64Data: fullImage.base64Data,
              };
            }

            console.log(`  9.${imgIndex + 1}. Image not found anywhere!`);
            return image;
          })
        );

        // Replace data-image-id attributes in description with actual base64 data
        let descriptionWithImages = subTask.description;
        
        if (descriptionWithImages && imagesWithData.length > 0) {
          console.log('10. Injecting base64 into description...');
          imagesWithData.forEach((image, imgIndex) => {
            if ('base64Data' in image && image.base64Data) {
              // Match img tags with this image ID and inject src attribute
              const imgRegex = new RegExp(
                `<img([^>]*)data-image-id="${image.id}"([^>]*)>`,
                'g'
              );
              const dataUrl = `data:${image.mimeType};base64,${image.base64Data}`;
              
              const beforeReplace = descriptionWithImages;
              descriptionWithImages = descriptionWithImages!.replace(
                imgRegex,
                (match, before, after) => {
                  // Remove any existing src attribute
                  const cleanedBefore = before.replace(/\s*src="[^"]*"\s*/g, ' ');
                  const cleanedAfter = after.replace(/\s*src="[^"]*"\s*/g, ' ');
                  // Add the new src attribute
                  return `<img${cleanedBefore} src="${dataUrl}" data-image-id="${image.id}"${cleanedAfter}>`;
                }
              );
              
              const wasReplaced = beforeReplace !== descriptionWithImages;
              console.log(`  11.${imgIndex + 1}. Image ${image.id} replacement:`, wasReplaced ? 'SUCCESS' : 'FAILED (not found in description)');
            }
          });
          
          console.log('12. Final description length:', descriptionWithImages.length);
          console.log('13. Final description preview:', descriptionWithImages.substring(0, 300));
        }

        return {
          ...subTask,
          description: descriptionWithImages,
          images: imagesWithData,
        };
      })
    );
    
    console.log('\n=== GET SUBTASKS - END ===\n');

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
    
    console.log('=== POST SUBTASK - START ===');
    console.log('1. Original description:', processedDescription?.substring(0, 200));
    
    if (processedDescription) {
      const imgRegex = /<img[^>]+src="data:([^;]+);base64,([^"]+)"[^>]*>/g;
      let match;
      let imageIndex = 1;
      
      while ((match = imgRegex.exec(processedDescription)) !== null) {
        const mimeType = match[1];
        const base64Data = match[2];
        const extension = mimeType.split('/')[1] || 'png';
        
        console.log(`2. Found image ${imageIndex}:`, {
          mimeType,
          base64Length: base64Data.length,
          extension
        });
        
        extractedImages.push({
          filename: `image-${imageIndex}.${extension}`,
          base64Data,
          mimeType,
        });
        
        imageIndex++;
      }
      
      console.log('3. Total images extracted:', extractedImages.length);
      
      // Remove img tags with base64 data - we'll replace them with ID-only placeholders after creation
      if (extractedImages.length > 0) {
        processedDescription = processedDescription.replace(/<img[^>]+src="data:[^"]*"[^>]*>/gi, '<!--IMAGE_PLACEHOLDER-->');
        console.log('4. Description after placeholder replacement:', processedDescription?.substring(0, 200));
      }
    }

    // Create subtask with images if found
    const subTask = await prisma.subTask.create({
      data: {
        title: title.trim(),
        description: processedDescription,
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

    // Replace placeholders with img tags containing only image IDs (no src attribute)
    if (subTask.images && subTask.images.length > 0 && processedDescription) {
      let updatedDescription = processedDescription;
      const sortedImages = subTask.images.sort((a, b) => a.order - b.order);
      
      console.log('5. Replacing placeholders with image IDs...');
      sortedImages.forEach((image, index) => {
        console.log(`6. Replacing placeholder ${index + 1} with image ID:`, image.id);
        // Replace the first placeholder with an img tag that has only the image ID
        updatedDescription = updatedDescription.replace(
          '<!--IMAGE_PLACEHOLDER-->',
          `<img data-image-id="${image.id}" alt="${image.filename}" class="rounded-lg max-w-full h-auto" />`
        );
      });
      
      console.log('7. Final description to save in DB:', updatedDescription);
      
      // Update the subtask with the new description containing only image IDs
      await prisma.subTask.update({
        where: { id: subTask.id },
        data: { description: updatedDescription },
      });
      
      subTask.description = updatedDescription;
    }

    // Cache the images
    if (subTask.images && subTask.images.length > 0) {
      console.log('8. Caching images...');
      subTask.images.forEach((image) => {
        saveImageToCache(image.id, image.base64Data, image.mimeType, image.filename);
        console.log(`9. Cached image ${image.id} to cache file`);
      });
    }
    
    console.log('=== POST SUBTASK - END ===\n');

    return NextResponse.json({ subTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
