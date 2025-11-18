"use client";

import { FileText, ClipboardList, CheckCircle2, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        <p className="text-black mt-2">
          Welcome to your admin dashboard, Super Administrator!
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-medium text-black mb-2">Email</h3>
          <p className="text-sm text-black">superadmin@dashboard.com</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-medium text-black mb-2">Status</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Active
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Total Projects</p>
              <p className="text-2xl font-bold text-black mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-[#5B4FCF]/10 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#5B4FCF]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Active Tasks</p>
              <p className="text-2xl font-bold text-black mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-[#5B4FCF]/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-[#5B4FCF]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Completed</p>
              <p className="text-2xl font-bold text-black mt-1">0</p>
            </div>
            <div className="w-12 h-12 bg-[#5B4FCF]/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#5B4FCF]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Productivity</p>
              <p className="text-2xl font-bold text-black mt-1">0%</p>
            </div>
            <div className="w-12 h-12 bg-[#5B4FCF]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#5B4FCF]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-black">
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <p className="text-black text-center py-8">
            No recent activity to display
          </p>
        </div>
      </div>
    </div>
  );
}
