import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "DUE_DATE_PASSED"
  | "DUE_DATE_CLOSE"
  | "PROJECT_COMPLETED"
  | "TASK_COMPLETED"
  | "TASK_ASSIGNED"
  | "TASK_UPDATED";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
}

export const notificationService = {
  // Create a new notification
  async createNotification(params: CreateNotificationParams) {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        taskId: params.taskId,
        projectId: params.projectId,
      },
    });
  },

  // Get all notifications for a user
  async getUserNotifications(userId: string, includeRead = false) {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { isRead: false }),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  // Get unread count
  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        isRead: true,
      },
    });
  },

  // Mark notification as unread
  async markAsUnread(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        isRead: false,
      },
    });
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  },

  // Delete old read notifications (cleanup)
  async deleteOldReadNotifications(userId: string, daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  },

  // Delete a single notification
  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
    });
  },

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string) {
    return await prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
  },

  // Check for due date notifications and create them
  async checkAndCreateDueDateNotifications() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Find tasks with due dates
    const tasks = await prisma.task.findMany({
      where: {
        status: {
          not: "done",
        },
        dueDate: {
          not: null,
        },
      },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    const notifications = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      const userId = task.project.userId;

      // Check if due date has passed
      if (dueDate < now) {
        // Check if we already created this notification
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            taskId: task.id,
            type: "DUE_DATE_PASSED",
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (!existing) {
          notifications.push({
            userId,
            type: "DUE_DATE_PASSED" as NotificationType,
            title: "Task Overdue",
            message: `Task "${task.title}" is overdue`,
            taskId: task.id,
            projectId: task.projectId,
          });
        }
      }
      // Check if due date is within 24 hours
      else if (dueDate >= now && dueDate <= tomorrow) {
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            taskId: task.id,
            type: "DUE_DATE_CLOSE",
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existing) {
          notifications.push({
            userId,
            type: "DUE_DATE_CLOSE" as NotificationType,
            title: "Task Due Soon",
            message: `Task "${task.title}" is due soon`,
            taskId: task.id,
            projectId: task.projectId,
          });
        }
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return notifications.length;
  },

  // Check if all tasks in a project are completed
  async checkProjectCompletion(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        user: true,
      },
    });

    if (!project || project.tasks.length === 0) return null;

    const allCompleted = project.tasks.every((task) => task.status === "done");

    if (allCompleted) {
      // Check if we already created this notification
      const existing = await prisma.notification.findFirst({
        where: {
          userId: project.userId,
          projectId: projectId,
          type: "PROJECT_COMPLETED",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        return await this.createNotification({
          userId: project.userId,
          type: "PROJECT_COMPLETED",
          title: "Project Completed! 🎉",
          message: `All tasks in "${project.name}" have been completed`,
          projectId: projectId,
        });
      }
    }

    return null;
  },

  // Notify when a task is completed
  async notifyTaskCompleted(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task || task.status !== "done") return null;

    return await this.createNotification({
      userId: task.project.userId,
      type: "TASK_COMPLETED",
      title: "Task Completed ✅",
      message: `You completed "${task.title}"`,
      taskId: task.id,
      projectId: task.projectId,
    });
  },
};
