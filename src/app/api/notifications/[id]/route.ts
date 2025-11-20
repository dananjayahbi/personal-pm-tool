import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";
import { verifyAuth } from "@/lib/auth";

// PATCH /api/notifications/[id] - Mark a specific notification as read
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
    await notificationService.markAsRead(notificationId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
