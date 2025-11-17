"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MobileMenu from "./MobileMenu";
import showToast from "@/lib/utils/toast";
import { LayoutGrid, ChevronDown, Menu, User, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPageMenu, setShowPageMenu] = useState(false);

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

  // Get current page name
  const getPageName = () => {
    if (pathname === "/dashboard") return "Test Page 1";
    if (pathname === "/user-management") return "User Management";
    if (pathname === "/settings") return "Settings";
    return "Test Page 1";
  };

  const pages = [
    { name: "Test Page 1", href: "/dashboard" },
    { name: "Test Page 2", href: "/dashboard" },
    { name: "Test Page 3", href: "/dashboard" },
  ];

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left side - Page selector with dropdown */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Page selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPageMenu(!showPageMenu)}
                className="flex items-center gap-2 px-4 py-2 text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LayoutGrid className="w-5 h-5 text-[#5B4FCF]" />
                <span className="font-medium">{getPageName()}</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${
                    showPageMenu ? "rotate-180" : ""
                  }`} 
                />
              </button>

              {/* Page dropdown menu */}
              {showPageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPageMenu(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    {pages.map((page) => (
                      <button
                        key={page.name}
                        onClick={() => {
                          setShowPageMenu(false);
                          router.push(page.href);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {page.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right side - User avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full bg-[#5B4FCF] flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-[#7C6FDE] transition-all"
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
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/settings");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
