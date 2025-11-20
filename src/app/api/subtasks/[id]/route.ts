import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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
    });

    if (!subTask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Update subtask
    const updatedSubTask = await prisma.subTask.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
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

    // Delete subtask
    await prisma.subTask.delete({
      where: { id },
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
