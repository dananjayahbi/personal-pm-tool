"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import showToast from "@/lib/utils/toast";
import { 
  LayoutGrid, 
  Home, 
  Users, 
  Settings,
  User,
  FolderKanban,
  Kanban
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();

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

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-6 h-6" />,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <FolderKanban className="w-6 h-6" />,
    },
    {
      name: "Task Board",
      href: "/task-board",
      icon: <Kanban className="w-6 h-6" />,
    },
    {
      name: "User Management",
      href: "/user-management",
      icon: <Users className="w-6 h-6" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="w-6 h-6" />,
    },
  ];

  return (
    <aside className="w-20 h-screen sticky top-0 hidden lg:flex overflow-hidden">
      {/* Gradient background matching color palette */}
      <div className="w-full h-full bg-linear-to-b from-[#2E6F40] via-[#68BA7F] to-[#253D2C] flex flex-col items-center py-6 px-3">
        {/* Logo/Icon at top */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
            <LayoutGrid className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col items-center space-y-4 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-white text-[#2E6F40] shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                title={item.name}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>

        {/* User avatar at bottom */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
            title="User Profile"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </aside>
  );
}
