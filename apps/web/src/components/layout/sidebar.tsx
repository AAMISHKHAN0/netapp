"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  CreditCard,
  MessageSquare,
  BarChart3,
  Wifi,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface SidebarProps {
  currentRole: string;
  tenantName?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Subscriber Directory", icon: Users },
  { href: "/packages", label: "Internet Packages", icon: Package },
  { href: "/billing", label: "Billing & Invoices", icon: Receipt },
  { href: "/payments", label: "Record Payment (POS)", icon: CreditCard },
  { href: "/reminders", label: "WhatsApp Reminders", icon: MessageSquare },
  { href: "/reports", label: "Income Reports", icon: BarChart3 },
];

export function Sidebar({ currentRole, tenantName = "SmartISP Operations", isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={onMobileClose}
        />
      )}
      
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0D121F] transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
      {/* Top Brand & Toggle */}
      <div className="h-16 px-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-600/30">
            <Wifi className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-none truncate">
                {tenantName}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase mt-0.5">
                Isolated Workspace
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations & Billing
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Details */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{currentRole} Mode</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {tenantName} · RLS Enforced
            </p>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <Building2 className="w-4 h-4" />
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
