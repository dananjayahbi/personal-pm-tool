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

    // Try to get from cache first
    const cachedImage = getImageFromCache(id);
    
    if (cachedImage) {
      return NextResponse.json({
        id,
        base64Data: cachedImage.base64Data,
        mimeType: cachedImage.mimeType,
        filename: cachedImage.filename,
      });
    }

    // If not in cache, fetch from database
    const image = await prisma.subTaskImage.findFirst({
      where: {
        id,
        subTask: {
          task: {
            project: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Save to cache for next time
    saveImageToCache(image.id, image.base64Data, image.mimeType, image.filename);

    return NextResponse.json({
      id: image.id,
      base64Data: image.base64Data,
      mimeType: image.mimeType,
      filename: image.filename,
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
