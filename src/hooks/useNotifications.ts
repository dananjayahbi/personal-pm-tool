"use client";

import { useState, useEffect } from "react";

export function useNotifications(pollingInterval = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?includeRead=false");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const checkDueDates = async () => {
    try {
      await fetch("/api/notifications/check-due-dates", {
        method: "POST",
      });
      // Refresh unread count after checking
      await fetchUnreadCount();
    } catch (error) {
      console.error("Error checking due dates:", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    checkDueDates();

    // Set up polling
    const interval = setInterval(() => {
      fetchUnreadCount();
      checkDueDates();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
}
