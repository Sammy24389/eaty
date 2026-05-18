"use client";

import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Menu } from "lucide-react";

export default function AdminHeader({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggleSidebar()}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          Admin Panel
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium hidden sm:block">
            {user?.name || "Admin"}
          </span>
        </div>

        <button
          onClick={logout}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
