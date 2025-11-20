import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";
import { verifyAuth } from "@/lib/auth";

// GET /api/notifications - Get all notifications for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeRead = searchParams.get("includeRead") === "true";

    const notifications = await notificationService.getUserNotifications(
      user.id,
      includeRead
    );

    const unreadCount = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await notificationService.markAllAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete all notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await notificationService.deleteAllNotifications(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return NextResponse.json(
      { error: "Failed to delete all notifications" },
      { status: 500 }
    );
  }
}
