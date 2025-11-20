"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import showToast from "@/lib/utils/toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  taskId?: string;
  projectId?: string;
  task?: {
    id: string;
    title: string;
    projectId: string;
  };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const includeRead = filter === "all";
      const response = await fetch(`/api/notifications?includeRead=${includeRead}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Optimistic update - update UI first
    if (filter === "unread") {
      // In unread tab, remove the notification from the list immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } else {
      // In all tab, just mark as read
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    }

    // Then call API in background
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert on error - refetch to restore correct state
      fetchNotifications();
      showToast.error("Failed to mark as read");
    }
  };

  const markAsUnread = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update - update UI first
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n))
    );

    // Then call API in background
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: false }),
      });
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      showToast.error("Failed to mark as unread");
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      showToast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update - update UI first (instant feedback)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    
    // Then call API in background
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      showToast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast.error("Failed to delete notification");
      // Optionally refetch notifications on error
      fetchNotifications();
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) {
      return;
    }
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
      });
      setNotifications([]);
      showToast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      showToast.error("Failed to clear all notifications");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to relevant page
    if (notification.taskId && notification.task?.projectId) {
      router.push(`/task-board?projectId=${notification.task.projectId}`);
      onClose();
    } else if (notification.projectId) {
      router.push(`/projects/${notification.projectId}`);
      onClose();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "DUE_DATE_PASSED":
        return "🔴";
      case "DUE_DATE_CLOSE":
        return "⚠️";
      case "PROJECT_COMPLETED":
        return "🎉";
      case "TASK_COMPLETED":
        return "✅";
      default:
        return "🔔";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#2E6F40] to-[#68BA7F]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-black hover:bg-opacity-20 rounded-full p-1 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "unread"
                  ? "bg-white text-[#2E6F40]"
                  : "bg-white bg-opacity-20 text-[#2E6F40] hover:text-black hover:bg-opacity-30"
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-white text-[#2E6F40] hover:text-black"
                  : "bg-white bg-opacity-20 text-[#2E6F40] hover:text-black hover:bg-opacity-30"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#2E6F40] hover:text-[#68BA7F] font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
            <button
              onClick={clearAllNotifications}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors ml-auto"
            >
              <XCircle className="w-4 h-4" />
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2E6F40]"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Bell className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    !notification.isRead ? "bg-blue-50 hover:bg-blue-100" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`text-sm font-semibold ${
                            !notification.isRead ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Mark as Read/Unread Button */}
                    {!notification.isRead ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-[#2E6F40] transition-colors p-1"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => markAsUnread(notification.id, e)}
                        className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Mark as unread"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => deleteNotification(notification.id, e)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
