"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileMenu from "./MobileMenu";
import showToast from "@/lib/utils/toast";
import { Menu, User, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        showToast.success("Logged out successfully");
        router.push("/login");
      } else {
        showToast.error("Logout failed");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left side - Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden text-black"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Empty space or you can add a logo/title here later */}
            <div className="text-xl font-semibold text-black">
              Personal PM Tool
            </div>
          </div>

          {/* Right side - User avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-[#2E6F40] flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-[#68BA7F] transition-all"
            >
              S
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/user-management");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/settings");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </>
  );
}
