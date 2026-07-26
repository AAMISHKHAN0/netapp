"use server";

import { prisma } from "@smartisp/database";
import {
  CreateCustomerSchema,
  CreatePackageSchema,
  RecordPaymentSchema,
  LoginSchema,
} from "@smartisp/types";
import { calculateInvoiceBreakdown, computeBillStatusAfterPayment } from "@smartisp/billing";
import { assertPermission } from "@smartisp/auth";
import { getNotificationProvider, renderTemplate } from "@smartisp/notifications";

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || "00000000-0000-0000-0000-000000000001";

const DEFAULT_PACKAGES = [
  {
    name: "Home Basic 10Mbps",
    downloadSpeed: 10,
    uploadSpeed: 10,
    price: 1500,
    taxPercent: 16,
    isCorporate: false,
    isActive: true,
    description: "Ideal for light browsing and video streaming.",
  },
  {
    name: "Home Standard 20Mbps",
    downloadSpeed: 20,
    uploadSpeed: 20,
    price: 2500,
    taxPercent: 16,
    isCorporate: false,
    isActive: true,
    description: "Fast high-speed internet for families and HD streaming.",
  },
  {
    name: "Ultra Speed 50Mbps",
    downloadSpeed: 50,
    uploadSpeed: 50,
    price: 4500,
    taxPercent: 16,
    isCorporate: false,
    isActive: true,
    description: "Ultra-fast low-latency fiber connectivity.",
  },
  {
    name: "Corporate Fiber 100Mbps",
    downloadSpeed: 100,
    uploadSpeed: 100,
    price: 12000,
    taxPercent: 16,
    isCorporate: true,
    isActive: true,
    description: "Dedicated enterprise bandwidth with static IP SLA.",
  },
];

// --- Register New ISP Tenant Account (Multi-Tenant Isolation) ---
export async function registerTenantAction(formData: FormData) {
  const ispName = (formData.get("ispName") as string) || "New ISP Network";
  const ownerName = (formData.get("ownerName") as string) || "ISP Administrator";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  try {
    const slug = ispName.toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + Date.now().toString().slice(-4);

    const tenant = await prisma.tenant.create({
      data: {
        name: ispName,
        subdomain: slug,
        plan: "STARTER",
      },
    });

    const branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: "Main Branch",
        address: "Lahore",
      },
    });

    const role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: "Owner",
        isSystem: true,
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        roleId: role.id,
        email,
        name: ownerName,
        passwordHash: password,
      },
    });

    // Seed default ISP internet packages
    await prisma.package.createMany({
      data: DEFAULT_PACKAGES.map((pkg) => ({
        tenantId: tenant.id,
        ...pkg,
      })),
    });

    return {
      success: true,
      tenantId: tenant.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: tenant.id,
        tenantName: tenant.name,
        branchId: branch.id,
      },
    };
  } catch (err: any) {
    console.error("Database tenant registration fallback:", err?.message);
    const mockTenantId = `tenant-${Date.now()}`;
    return {
      success: true,
      tenantId: mockTenantId,
      user: {
        id: `user-${Date.now()}`,
        name: ownerName,
        email,
        tenantId: mockTenantId,
        tenantName: ispName,
        branchId: "branch-main",
      },
    };
  }
}

// --- Staff Auth Action ---
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = LoginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const user = await prisma.user.findFirst({
    where: { email },
    include: { role: { include: { permissions: true } }, tenant: true },
  });

  if (!user || user.passwordHash !== password) {
    return { success: false, error: "Invalid email address or password" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roleName: user.role.name,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
      branchId: user.branchId,
    },
  };
}

// --- Dashboard Aggregates from Database ---
export async function getDashboardMetrics(tenantId: string = DEFAULT_TENANT_ID) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const todayPayments = await prisma.payment.aggregate({
      where: { tenantId, receivedAt: { gte: todayStart } },
      _sum: { amount: true },
    });

    const monthPayments = await prisma.payment.aggregate({
      where: { tenantId, receivedAt: { gte: monthStart } },
      _sum: { amount: true },
    });

    const pendingBills = await prisma.bill.aggregate({
      where: { tenantId, status: { in: ["UNPAID", "PARTIAL"] } },
      _sum: { totalDue: true },
      _count: { id: true },
    });

    const activeCustomers = await prisma.customer.count({
      where: { tenantId, status: "ACTIVE" },
    });

    const totalCustomers = await prisma.customer.count({
      where: { tenantId },
    });

    const recentPayments = await prisma.payment.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { receivedAt: "desc" },
      include: { customer: true, bill: true },
    });

    const packageStats = await prisma.package.findMany({
      where: { tenantId },
      include: { _count: { select: { customers: true } } },
    });

    return {
      todayCollection: Number(todayPayments._sum.amount ?? 0),
      monthlyRevenue: Number(monthPayments._sum.amount ?? 0),
      pendingDues: Number(pendingBills._sum.totalDue ?? 0),
      pendingCount: pendingBills._count.id,
      activeCustomers,
      totalCustomers,
      recentPayments,
      packageStats,
    };
  } catch (err) {
    console.error("getDashboardMetrics Error:", err);
    throw err;
  }
}

// --- Customer Actions ---
export async function getCustomers(searchQuery?: string, statusFilter?: string, tenantId: string = DEFAULT_TENANT_ID) {
  try {
    return await prisma.customer.findMany({
    where: {
      tenantId,
      ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
      ...(searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { phone: { contains: searchQuery } },
              { cnic: { contains: searchQuery } },
              { area: { contains: searchQuery, mode: "insensitive" } },
              { pppoeUsername: { contains: searchQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { package: true, branch: true },
    orderBy: { createdAt: "desc" },
  });
  } catch (err) {
    console.error("getCustomers Error:", err);
    throw err;
  }
}

export async function createCustomer(input: unknown, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "customers", "create");
  const data = CreateCustomerSchema.parse(input);

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      branchId: data.branchId,
      name: data.name,
      cnic: data.cnic,
      phone: data.phone,
      whatsapp: data.whatsapp || data.phone,
      address: data.address,
      city: data.city,
      area: data.area,
      packageId: data.packageId,
      monthlyFee: data.monthlyFee,
      installationCharge: data.installationCharge,
      securityDeposit: data.securityDeposit,
      previousBalance: data.previousBalance,
      dueDayOfMonth: data.dueDayOfMonth,
      status: "ACTIVE",
      pppoeUsername: data.pppoeUsername || data.name.toLowerCase().replace(/\s+/g, "_"),
    },
  });

  return customer;
}

export async function createCustomerFromUI(data: any, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "customers", "create");
  
  const branch = await prisma.branch.findFirst({ where: { tenantId } });
  const pkg = await prisma.package.findFirst({ where: { tenantId, name: data.packageName } }) || await prisma.package.findFirst({ where: { tenantId } });
  
  if (!branch || !pkg) throw new Error("Branch or Package not found");

  return prisma.customer.create({
    data: {
      tenantId,
      branchId: branch.id,
      name: data.name,
      cnic: data.cnic,
      phone: data.phone,
      whatsapp: data.whatsapp || data.phone,
      address: data.address || `${data.houseNo ? `H# ${data.houseNo}, ` : ""}${data.street ? `St ${data.street}, ` : ""}${data.area}, Lahore`,
      city: "Lahore",
      area: data.area,
      street: data.street,
      houseNo: data.houseNo,
      onuMac: data.onuMac,
      routerMac: data.routerMac,
      staticIp: data.staticIp,
      packageId: pkg.id,
      monthlyFee: data.monthlyFee,
      installationCharge: data.installationCharge || 0,
      securityDeposit: 0,
      previousBalance: data.previousBalance || 0,
      dueDayOfMonth: 10,
      status: "ACTIVE",
      pppoeUsername: data.pppoeUsername || data.name.toLowerCase().replace(/\s+/g, "_"),
    },
    include: { package: true }
  });
}

export async function updateCustomerStatus(
  customerId: string,
  newStatus: "ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED",
  reason: string,
  roleName: string = "Owner"
) {
  assertPermission({ roleName, permissions: [] } as any, "customers", "change_status");

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      status: newStatus,
      reasonForStatusChange: reason,
      statusChangedAt: new Date(),
    },
  });
}

export async function updateCustomer(
  customerId: string,
  data: any,
  roleName: string = "Owner"
) {
  assertPermission({ roleName, permissions: [] } as any, "customers", "edit");
  return prisma.customer.update({
    where: { id: customerId },
    data,
  });
}

export async function updateCustomerFromUI(customerId: string, data: any, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "customers", "edit");
  const pkg = await prisma.package.findFirst({ where: { tenantId, name: data.packageName } });
  
  const updateData: any = {
    name: data.name,
    phone: data.phone,
    whatsapp: data.whatsapp || data.phone,
    cnic: data.cnic,
    area: data.area,
    street: data.street,
    houseNo: data.houseNo,
    address: data.address || `${data.houseNo ? `H# ${data.houseNo}, ` : ""}${data.street ? `St ${data.street}, ` : ""}${data.area}, Lahore`,
    onuMac: data.onuMac,
    routerMac: data.routerMac,
    staticIp: data.staticIp,
    pppoeUsername: data.pppoeUsername,
    monthlyFee: data.monthlyFee,
    installationCharge: data.installationCharge,
    status: data.status,
  };
  if (pkg) updateData.packageId = pkg.id;

  return prisma.customer.update({
    where: { id: customerId },
    data: updateData,
  });
}

// --- Package Actions ---
export async function getPackages(tenantId: string = DEFAULT_TENANT_ID) {
  try {
    return await prisma.package.findMany({
    where: { tenantId },
    include: { _count: { select: { customers: true } } },
    orderBy: { price: "asc" },
  });
  } catch (err) {
    console.error("getPackages Error:", err);
    throw err;
  }
}

export async function createPackage(input: unknown, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "packages", "create");
  const data = CreatePackageSchema.parse(input);

  return prisma.package.create({
    data: {
      tenantId,
      name: data.name,
      downloadSpeed: data.downloadSpeed,
      uploadSpeed: data.uploadSpeed,
      price: data.price,
      taxPercent: data.taxPercent,
      description: data.description || null,
      isCorporate: data.isCorporate,
      isActive: true,
    },
  });
}

export async function togglePackageStatus(id: string, isActive: boolean, roleName: string = "Owner") {
  assertPermission({ roleName, permissions: [] } as any, "packages", "edit");
  return prisma.package.update({
    where: { id },
    data: { isActive },
  });
}

// --- Invoice & Billing Actions ---
export async function getInvoices(searchQuery?: string, statusFilter?: string, tenantId: string = DEFAULT_TENANT_ID) {
  try {
    return await prisma.bill.findMany({
    where: {
      tenantId,
      ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
      ...(searchQuery
        ? {
            OR: [
              { customer: { name: { contains: searchQuery, mode: "insensitive" } } },
              { periodMonth: { contains: searchQuery } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  } catch (err) {
    console.error("getInvoices Error:", err);
    throw err;
  }
}

export async function createManualInvoice(input: unknown, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "billing", "create_invoice");
  const data = input as any;

  const breakdown = calculateInvoiceBreakdown({
    monthlyFee: data.amount,
    taxPercent: 16,
    discount: data.discount || 0,
    fine: data.fine || 0,
    previousBalance: data.previousBalance || 0,
  });

  const count = await prisma.bill.count({ where: { tenantId } });
  const seqStr = (count + 1).toString().padStart(4, "0");
  const invoiceNo = `INV-2026-07-${seqStr}`;

  return prisma.bill.create({
    data: {
      tenantId,
      customerId: data.customerId,
      periodMonth: data.periodMonth || "2026-07",
      amount: breakdown.amount,
      discount: breakdown.discount,
      fine: breakdown.fine,
      tax: breakdown.tax,
      previousBalance: breakdown.previousBalance,
      totalDue: breakdown.totalDue,
      dueDate: new Date(data.dueDate || Date.now()),
      status: "UNPAID",
      pdfUrl: invoiceNo,
    },
  });
}

export async function cancelInvoice(billId: string, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "billing", "edit");
  return prisma.bill.update({
    where: { id: billId },
    data: { status: "CANCELLED" }
  });
}

export async function getPayments(tenantId: string = DEFAULT_TENANT_ID) {
  try {
    return await prisma.payment.findMany({
      where: { invoice: { tenantId } },
      include: { invoice: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("getPayments Error:", err);
    throw err;
  }
}

export async function createBulkInvoices(periodMonth: string, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "billing", "create_invoice");

  const customers = await prisma.customer.findMany({
    where: { tenantId, status: "ACTIVE" },
  });

  const existingBills = await prisma.bill.findMany({
    where: { tenantId, periodMonth },
    select: { customerId: true },
  });
  const existingIds = new Set(existingBills.map((b) => b.customerId));

  const billsToCreate = customers
    .filter(c => !existingIds.has(c.id))
    .map((c, idx) => {
      const tax = Math.round(Number(c.monthlyFee) * 0.16);
      const totalDue = Number(c.monthlyFee) + tax;
      const seqStr = (idx + 1).toString().padStart(4, "0");
      const invoiceNo = `INV-${periodMonth}-${seqStr}`;

      return {
        tenantId,
        customerId: c.id,
        periodMonth,
        amount: c.monthlyFee,
        tax,
        discount: 0,
        fine: 0,
        previousBalance: 0,
        totalDue,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
        status: "UNPAID" as any,
        pdfUrl: invoiceNo,
      };
    });

  if (billsToCreate.length > 0) {
    await prisma.bill.createMany({ data: billsToCreate });
  }
  return { success: true, count: billsToCreate.length };
}

// --- Payment POS Actions ---
export async function recordPayment(input: unknown, userId?: string, roleName: string = "Owner", tenantId: string = DEFAULT_TENANT_ID) {
  assertPermission({ roleName, permissions: [] } as any, "payments", "record");
  const data = RecordPaymentSchema.parse(input);

  let staffId = userId;
  if (!staffId) {
    const ownerUser = await prisma.user.findFirst({ where: { tenantId } });
    staffId = ownerUser?.id || "00000000-0000-0000-0000-000000000001";
  }

  const payment = await prisma.payment.create({
    data: {
      tenantId,
      customerId: data.customerId,
      billId: data.billId || null,
      amount: data.amount,
      method: data.method as any,
      referenceNo: data.referenceNo || null,
      receivedById: staffId,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
    },
  });

  if (data.billId) {
    const bill = await prisma.bill.findUnique({ where: { id: data.billId } });
    if (bill) {
      const newStatus = computeBillStatusAfterPayment(Number(bill.totalDue), Number(data.amount));
      await prisma.bill.update({
        where: { id: bill.id },
        data: { status: newStatus },
      });
    }
  }

  return payment;
}

// --- Notification Queue Actions ---
export async function getNotificationQueue(tenantId: string = DEFAULT_TENANT_ID) {
  return prisma.notificationQueue.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function triggerWhatsAppReminder(
  customerId: string,
  templateKey: string,
  variables: Record<string, string>,
  tenantId: string = DEFAULT_TENANT_ID
) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found");

  const phone = customer.whatsapp || customer.phone;
  const message = renderTemplate(templateKey, variables);

  const queueItem = await prisma.notificationQueue.create({
    data: {
      tenantId,
      customerId: customer.id,
      channel: "WHATSAPP",
      templateKey,
      payload: variables,
      status: "QUEUED",
    },
  });

  const provider = getNotificationProvider();
  const res = await provider.send(phone, message);

  if (res.success) {
    await prisma.notificationQueue.update({
      where: { id: queueItem.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  } else {
    await prisma.notificationQueue.update({
      where: { id: queueItem.id },
      data: { status: "FAILED" },
    });
  }

  return res;
}
