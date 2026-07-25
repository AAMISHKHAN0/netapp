"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  Bell,
  Building2,
  UserCheck,
  LogOut,
  Sun,
  Moon,
  Wifi,
  ChevronDown,
} from "lucide-react";
import { CommandPalette } from "./command-palette";

export function Topbar({
  currentRole,
  onRoleChange,
  tenantName = "SmartISP Operations",
  userName = "Admin User",
}: {
  currentRole: string;
  onRoleChange: (role: string) => void;
  tenantName?: string;
  userName?: string;
}) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [unreadNotifications, setUnreadNotifications] = React.useState(2);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("smartisp_session_user");
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0D121F]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
      {/* Search trigger & Mobile Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <Wifi className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{tenantName}</span>
        </div>

        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
            });
            window.dispatchEvent(event);
          }}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 transition-colors w-60 shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Search or type command...</span>
          <kbd className="ml-auto text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{tenantName}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <UserCheck className="w-3.5 h-3.5 ml-2 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-medium">Role:</span>
          {(["Owner", "Branch Manager", "Cashier"] as const).map((role) => (
            <button
              key={role}
              onClick={() => onRoleChange(role)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                currentRole === role
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-xs space-y-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Notifications</span>
                <button
                  onClick={() => setUnreadNotifications(0)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border-l-3 border-blue-600">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Tenant Workspace Ready</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Logged into {tenantName}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-2.5 pr-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">{userName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 text-xs space-y-1 z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{tenantName}</p>
              </div>

              {/* Theme Switcher options inside Profile */}
              <div className="p-2 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Theme</span>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      theme === "light"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      theme === "dark"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Dark
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-semibold transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CommandPalette />
    </header>
  );
}
