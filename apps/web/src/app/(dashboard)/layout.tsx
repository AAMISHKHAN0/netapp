"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

export const RoleContext = React.createContext<{
  role: string;
  setRole: (role: string) => void;
  tenantId: string;
  tenantName: string;
  userName: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}>({
  role: "Owner",
  setRole: () => {},
  tenantId: "00000000-0000-0000-0000-000000000001",
  tenantName: "SmartISP Operations",
  userName: "Admin User",
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = React.useState<string>("Owner");
  const [tenantId, setTenantId] = React.useState<string>("00000000-0000-0000-0000-000000000001");
  const [tenantName, setTenantName] = React.useState<string>("SmartISP Operations");
  const [userName, setUserName] = React.useState<string>("Admin User");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("smartisp_session_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tenantId) {
          setTenantId(parsed.tenantId);
        }
        if (parsed.tenantName || parsed.ispName) {
          setTenantName(parsed.tenantName || parsed.ispName);
        }
        if (parsed.name || parsed.ownerName) {
          setUserName(parsed.name || parsed.ownerName);
        }
      }
    } catch (err) {
      console.error("Session parse error:", err);
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, tenantId, tenantName, userName, isMobileMenuOpen, setIsMobileMenuOpen }}>
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] transition-colors duration-300">
        {/* Clean full-height left sidebar */}
        <Sidebar 
          currentRole={role} 
          tenantName={tenantName} 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Right main area with topbar header and page container */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Topbar 
            currentRole={role} 
            onRoleChange={setRole} 
            tenantName={tenantName} 
            userName={userName} 
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300 relative z-0">
            {children}
          </main>
        </div>
      </div>
      
      {/* Global Modals */}
      <CommandPalette />
    </RoleContext.Provider>
  );
}
