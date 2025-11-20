"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Target,
  Award,
} from "lucide-react";
import FullPageLoader from "./components/FullPageLoader";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  tasksDueToday: number;
  productivity: number;
}

interface RecentProject {
  id: string;
  name: string;
  color: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState({ todo: 0, "in-progress": 0, done: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      setStats(data.stats);
      setRecentProjects(data.recentProjects || []);
      setTasksByStatus(data.charts?.tasksByStatus || { todo: 0, "in-progress": 0, done: 0 });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  if (!stats) {
    return <div>Failed to load dashboard data</div>;
  }

  const getMotivationalMessage = () => {
    if (stats.productivity >= 80) return "🔥 You're crushing it! Keep up the amazing work!";
    if (stats.productivity >= 60) return "💪 Great progress! You're doing awesome!";
    if (stats.productivity >= 40) return "🌟 Nice work! Keep pushing forward!";
    if (stats.productivity >= 20) return "🚀 You've got this! Every task counts!";
    return "✨ Let's start strong! Your next achievement awaits!";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#2E6F40] to-[#68BA7F] rounded-2xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome Back! 👋</h1>
        <p className="text-white/90 mt-2 text-lg">{getMotivationalMessage()}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-black mt-1">{stats.totalProjects}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeProjects} active</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-black mt-1">{stats.totalTasks}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.inProgressTasks} in progress</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedTasks}</p>
              <p className="text-xs text-gray-500 mt-1">out of {stats.totalTasks}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productivity</p>
              <p className="text-3xl font-bold text-black mt-1">{stats.productivity}%</p>
              <p className="text-xs text-gray-500 mt-1">completion rate</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Cards for Overdue and Due Today */}
      {(stats.overdueTasks > 0 || stats.tasksDueToday > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.overdueTasks > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-900">
                  {stats.overdueTasks} Overdue Task{stats.overdueTasks > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-700">Needs your attention!</p>
              </div>
            </div>
          )}
          {stats.tasksDueToday > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-yellow-900">
                  {stats.tasksDueToday} Task{stats.tasksDueToday > 1 ? "s" : ""} Due Today
                </p>
                <p className="text-sm text-yellow-700">Let's get them done!</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Status Distribution & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-black mb-6 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Task Distribution
          </h2>
          <div className="space-y-4">
            {/* Todo */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">To Do</span>
                <span className="font-semibold text-gray-900">{tasksByStatus.todo}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gray-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalTasks > 0 ? (tasksByStatus.todo / stats.totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">In Progress</span>
                <span className="font-semibold text-blue-600">{tasksByStatus["in-progress"]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      stats.totalTasks > 0 ? (tasksByStatus["in-progress"] / stats.totalTasks) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Done */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{tasksByStatus.done}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalTasks > 0 ? (tasksByStatus.done / stats.totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold">Your Progress</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Completion</span>
                <span className="font-bold">{stats.productivity}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-4">
                <div
                  className="bg-white h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${stats.productivity}%` }}
                >
                  {stats.productivity > 15 && (
                    <span className="text-xs font-bold text-purple-600">
                      {stats.productivity}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-white/90 text-sm mb-2">Achievements Unlocked:</p>
              <div className="flex flex-wrap gap-2">
                {stats.completedTasks >= 1 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs">First Task ✅</span>
                )}
                {stats.completedTasks >= 10 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Task Master 🏆</span>
                )}
                {stats.productivity >= 50 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Half Way 🎯</span>
                )}
                {stats.productivity >= 100 && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs">Perfect! 🌟</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-black">Recent Projects</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <div>
                      <p className="font-semibold text-black">{project.name}</p>
                      <p className="text-sm text-gray-500">
                        {project.completedTasks} / {project.totalTasks} tasks completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "Paused"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
                    {project.totalTasks > 0 && (
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${(project.completedTasks / project.totalTasks) * 100}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
