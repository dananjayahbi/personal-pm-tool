"use client";

import { useState, useEffect } from "react";
import FullPageLoader from "@/components/common/FullPageLoader";

const SettingsPage = () => {
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
        <h1 className="text-3xl font-bold text-black">Settings</h1>
        <p className="text-black mt-2">
          Configure your application preferences
        </p>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-black">Settings page content will be displayed here</p>
      </div>
    </div>
  )
}

export default SettingsPage