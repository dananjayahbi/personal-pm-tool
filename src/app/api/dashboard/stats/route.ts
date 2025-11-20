import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all projects for the user
    const totalProjects = await prisma.project.count({
      where: { userId: user.id },
    });

    const activeProjects = await prisma.project.count({
      where: {
        userId: user.id,
        status: "Active",
      },
    });

    // Get all tasks across all user's projects
    const allTasks = await prisma.task.findMany({
      where: {
        project: {
          userId: user.id,
        },
      },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.status === "done").length;
    const inProgressTasks = allTasks.filter((task) => task.status === "in-progress").length;
    const todoTasks = allTasks.filter((task) => task.status === "todo").length;

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = allTasks.filter(
      (task) => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== "done"
    ).length;

    // Calculate tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = allTasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) >= today &&
        new Date(task.dueDate) < tomorrow &&
        task.status !== "done"
    ).length;

    // Calculate productivity (completed vs total)
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get task completion by status for chart
    const tasksByStatus = {
      todo: todoTasks,
      "in-progress": inProgressTasks,
      done: completedTasks,
    };

    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        tasks: {
          select: {
            status: true,
          },
        },
      },
    });

    // Get task completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCompletedTasks = await prisma.task.findMany({
      where: {
        project: {
          userId: user.id,
        },
        status: "done",
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        updatedAt: true,
      },
    });

    // Group by date
    const completionByDate: Record<string, number> = {};
    recentCompletedTasks.forEach((task) => {
      const date = task.updatedAt.toISOString().split("T")[0];
      completionByDate[date] = (completionByDate[date] || 0) + 1;
    });

    return NextResponse.json({
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        tasksDueToday,
        productivity,
      },
      charts: {
        tasksByStatus,
        completionByDate,
      },
      recentProjects: recentProjects.map((project) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        status: project.status,
        totalTasks: project.tasks.length,
        completedTasks: project.tasks.filter((t) => t.status === "done").length,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
