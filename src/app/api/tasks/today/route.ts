import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date range (start and end of today in DateTime format)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all tasks due today across all user's projects
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          userId: user.id,
        },
        dueDate: {
          gte: today.toISOString(),
          lt: tomorrow.toISOString(),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's tasks" },
      { status: 500 }
    );
  }
}
