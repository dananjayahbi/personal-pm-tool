"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import showToast from "@/lib/utils/toast";
import { 
  LayoutGrid, 
  Home, 
  Users, 
  ClipboardList, 
  Settings, 
  FolderOpen, 
  Database, 
  MessageSquare, 
  Globe,
  X,
  LogOut
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        showToast.success("Logged out successfully");
        onClose();
        router.push("/login");
      } else {
        showToast.error("Logout failed");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-6 h-6" />,
    },
    {
      name: "User Management",
      href: "/user-management",
      icon: <Users className="w-6 h-6" />,
    },
    {
      name: "Tasks",
      href: "/settings",
      icon: <ClipboardList className="w-6 h-6" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="w-6 h-6" />,
    },
    {
      name: "Files",
      href: "/settings",
      icon: <FolderOpen className="w-6 h-6" />,
    },
    {
      name: "Database",
      href: "/settings",
      icon: <Database className="w-6 h-6" />,
    },
    {
      name: "Messages",
      href: "/settings",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      name: "Network",
      href: "/settings",
      icon: <Globe className="w-6 h-6" />,
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 h-full w-72 z-50 lg:hidden shadow-xl">
        <div className="h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-[#5B4FCF] via-[#7C6FDE] to-[#5B4FCF]" />
          <div className="relative z-10 flex flex-col h-full py-6 px-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <LayoutGrid className="w-7 h-7 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="font-bold text-lg">PM Tool</h2>
                  <p className="text-xs text-white/70">Project Manager</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href && index === 0;
                return (
                  <Link
                    key={item.href + index}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      isActive
                        ? "bg-white text-[#5B4FCF] shadow-lg"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    title={item.name}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div className="flex-1 text-white">
                  <p className="text-sm font-medium">Super Admin</p>
                  <p className="text-xs text-white/70">admin@dashboard.com</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
