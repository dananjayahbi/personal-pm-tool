import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";
import { verifyAuth } from "@/lib/auth";

// PATCH /api/notifications/[id] - Mark a specific notification as read or unread
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationId = params.id;
    const body = await request.json();
    const { isRead } = body;

    if (isRead === false) {
      await notificationService.markAsUnread(notificationId, user.id);
    } else {
      await notificationService.markAsRead(notificationId, user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete a specific notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationId = params.id;
    await notificationService.deleteNotification(notificationId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
