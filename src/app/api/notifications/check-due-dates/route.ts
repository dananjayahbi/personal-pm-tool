import { NextRequest, NextResponse } from "next/server";
import { notificationService } from "@/services/notificationService";
import { verifyAuth } from "@/lib/auth";

// POST /api/notifications/check-due-dates - Check and create due date notifications
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await notificationService.checkAndCreateDueDateNotifications();

    return NextResponse.json({ 
      success: true,
      notificationsCreated: count 
    });
  } catch (error) {
    console.error("Error checking due dates:", error);
    return NextResponse.json(
      { error: "Failed to check due dates" },
      { status: 500 }
    );
  }
}
