"use client";

import { useState, useEffect } from "react";
import FullPageLoader from "@/components/common/FullPageLoader";

export default function UserManagementPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">User Management</h1>
        <p className="text-black mt-2">
          Manage your user profile and preferences
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-black">
            Profile Information
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-[#2E6F40] flex items-center justify-center text-white text-3xl font-bold">
              U
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-black">
                User Name
              </h3>
              <p className="text-black">user@example.com</p>
              <button className="mt-2 px-4 py-2 bg-[#2E6F40] text-white rounded-lg hover:bg-[#253D2C] transition-colors">
                Change Avatar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                placeholder="Enter your name"
                defaultValue="User Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                placeholder="Enter your email"
                defaultValue="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Bio
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                rows={4}
                placeholder="Tell us about yourself"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button className="px-6 py-2 bg-[#2E6F40] text-white rounded-lg hover:bg-[#253D2C] transition-colors">
              Save Changes
            </button>
            <button className="px-6 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
