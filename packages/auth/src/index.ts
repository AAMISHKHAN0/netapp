export type SystemRoleName = "Owner" | "Branch Manager" | "Cashier" | "Technician" | "Support Agent";

export interface UserSession {
  id: string;
  tenantId: string;
  branchId?: string | null;
  name: string;
  email: string;
  roleName: SystemRoleName;
  permissions: { module: string; action: string }[];
}

export const ROLE_PERMISSIONS: Record<SystemRoleName, Array<{ module: string; action: string }>> = {
  Owner: [
    { module: "*", action: "*" }, // Full permissions
  ],
  "Branch Manager": [
    { module: "customers", action: "view" },
    { module: "customers", action: "create" },
    { module: "customers", action: "edit" },
    { module: "customers", action: "change_status" },
    { module: "packages", action: "view" },
    { module: "billing", action: "view" },
    { module: "billing", action: "create_invoice" },
    { module: "payments", action: "view" },
    { module: "payments", action: "record" },
    { module: "reminders", action: "view" },
    { module: "reminders", action: "send" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
  ],
  Cashier: [
    { module: "customers", action: "view" },
    { module: "billing", action: "view" },
    { module: "payments", action: "view" },
    { module: "payments", action: "record" },
    { module: "reminders", action: "view" },
    { module: "reports", action: "view" },
  ],
  Technician: [
    { module: "customers", action: "view" },
    { module: "complaints", action: "view" },
    { module: "complaints", action: "resolve" },
  ],
  "Support Agent": [
    { module: "customers", action: "view" },
    { module: "complaints", action: "view" },
    { module: "complaints", action: "create" },
    { module: "complaints", action: "edit" },
  ],
};

export function hasPermission(
  session: UserSession | null | undefined,
  module: string,
  action: string
): boolean {
  if (!session) return false;

  // Owner / Super Admin shortcut
  if (session.roleName === "Owner") return true;

  // Check explicit permissions
  return session.permissions.some(
    (p) =>
      (p.module === "*" || p.module === module) &&
      (p.action === "*" || p.action === action)
  );
}

export function assertPermission(
  session: UserSession | null | undefined,
  module: string,
  action: string
): void {
  if (!hasPermission(session, module, action)) {
    throw new Error(
      `Forbidden: User role '${session?.roleName ?? "Anonymous"}' lacks permission '${action}' on module '${module}'`
    );
  }
}
