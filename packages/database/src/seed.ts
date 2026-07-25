import { PrismaClient, CustomerStatus, BillStatus, PaymentMethod, NotificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("Seeding SmartISP multi-tenant database...");

  // 1. Clean existing data
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE tenants CASCADE;`);

  // 2. Create Default Tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: DEFAULT_TENANT_ID,
      name: "SmartISP Operations",
      subdomain: "smartisp",
      plan: "STARTER",
      status: "ACTIVE",
      branding: {
        primaryColor: "#4F46E5",
        logoUrl: "/logo.png",
      },
    },
  });

  console.log(`Created tenant: ${tenant.name}`);

  // 3. Create Branches
  const branchJohar = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: "Johar Town Branch",
      address: "Main Boulevard, Johar Town, Lahore",
    },
  });

  const branchGulberg = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: "Gulberg Branch",
      address: "MM Alam Road, Gulberg III, Lahore",
    },
  });

  console.log("Created branches: Johar Town & Gulberg");

  // 4. Create Roles & Permissions
  const roleOwner = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "Owner",
      description: "Super Admin with full access",
      isSystem: true,
      permissions: {
        create: [{ module: "*", action: "*" }],
      },
    },
  });

  const roleManager = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "Branch Manager",
      description: "Manages branch customers, billing, and staff",
      isSystem: true,
      permissions: {
        create: [
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
      },
    },
  });

  const roleCashier = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: "Cashier",
      description: "Collects payments and issues receipts",
      isSystem: true,
      permissions: {
        create: [
          { module: "customers", action: "view" },
          { module: "billing", action: "view" },
          { module: "payments", action: "view" },
          { module: "payments", action: "record" },
          { module: "reminders", action: "view" },
          { module: "reports", action: "view" },
        ],
      },
    },
  });

  // 5. Create Staff Users
  const userOwner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Zain Malik (Owner)",
      email: "owner@smartisp.com",
      phone: "03001234567",
      passwordHash: "password123",
      roleId: roleOwner.id,
    },
  });

  const userManager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branchJohar.id,
      name: "Hamza Riaz (Manager)",
      email: "manager@smartisp.com",
      phone: "03019876543",
      passwordHash: "password123",
      roleId: roleManager.id,
    },
  });

  const userCashier = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branchJohar.id,
      name: "Sara Khan (Cashier)",
      email: "cashier@smartisp.com",
      phone: "03025554433",
      passwordHash: "password123",
      roleId: roleCashier.id,
    },
  });

  console.log("Created users: Owner, Manager, Cashier");

  // 6. Create Packages
  const pkg10M = await prisma.package.create({
    data: {
      tenantId: tenant.id,
      name: "Basic 10Mbps",
      downloadSpeed: 10,
      uploadSpeed: 10,
      price: 1500,
      taxPercent: 16,
      description: "Suitable for light browsing & messaging",
    },
  });

  const pkg20M = await prisma.package.create({
    data: {
      tenantId: tenant.id,
      name: "Home Standard 20Mbps",
      downloadSpeed: 20,
      uploadSpeed: 20,
      price: 2500,
      taxPercent: 16,
      description: "Ideal for streaming and work-from-home",
    },
  });

  const pkg50M = await prisma.package.create({
    data: {
      tenantId: tenant.id,
      name: "Ultra Speed 50Mbps",
      downloadSpeed: 50,
      uploadSpeed: 50,
      price: 4500,
      taxPercent: 16,
      description: "High bandwidth for gaming & HD streaming",
    },
  });

  const pkgCorp100M = await prisma.package.create({
    data: {
      tenantId: tenant.id,
      name: "Corporate Fiber 100Mbps",
      downloadSpeed: 100,
      uploadSpeed: 100,
      price: 12000,
      taxPercent: 16,
      isCorporate: true,
      description: "Dedicated fiber link with static IP",
    },
  });

  console.log("Created internet packages");

  // 7. Create Customers
  const custAli = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      branchId: branchJohar.id,
      name: "Ali Raza Khan",
      cnic: "35202-1234567-1",
      phone: "03004445566",
      whatsapp: "03004445566",
      email: "ali.khan@gmail.com",
      address: "House 45, Block R3, Johar Town",
      city: "Lahore",
      area: "Johar Town",
      onuMac: "48:8F:5A:12:34:56",
      pppoeUsername: "ali_johar20",
      packageId: pkg20M.id,
      monthlyFee: 2500,
      status: CustomerStatus.ACTIVE,
      dueDayOfMonth: 10,
    },
  });

  const custUsman = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      branchId: branchJohar.id,
      name: "Muhammad Usman",
      cnic: "35201-9876543-3",
      phone: "03218889900",
      whatsapp: "03218889900",
      email: "usman.m@yahoo.com",
      address: "Street 12, Block G, Johar Town",
      city: "Lahore",
      area: "Johar Town",
      onuMac: "48:8F:5A:99:88:77",
      pppoeUsername: "usman_10m",
      packageId: pkg10M.id,
      monthlyFee: 1500,
      status: CustomerStatus.ACTIVE,
      dueDayOfMonth: 10,
    },
  });

  const custFatima = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      branchId: branchGulberg.id,
      name: "Fatima Ahmed",
      cnic: "35202-5554433-2",
      phone: "03337776655",
      whatsapp: "03337776655",
      email: "fatima.ahmed@outlook.com",
      address: "Plot 88, Main Boulevard, Gulberg III",
      city: "Lahore",
      area: "Gulberg",
      onuMac: "00:1A:2B:3C:4D:5E",
      pppoeUsername: "fatima_50m",
      packageId: pkg50M.id,
      monthlyFee: 4500,
      status: CustomerStatus.ACTIVE,
      dueDayOfMonth: 10,
    },
  });

  const custTariq = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      branchId: branchJohar.id,
      name: "Tariq Mehmood",
      cnic: "35201-1122334-5",
      phone: "03051112233",
      whatsapp: "03051112233",
      address: "House 102, Block B, Johar Town",
      city: "Lahore",
      area: "Johar Town",
      onuMac: "E4:8D:8C:11:22:33",
      pppoeUsername: "tariq_suspended",
      packageId: pkg20M.id,
      monthlyFee: 2500,
      previousBalance: 2500,
      status: CustomerStatus.SUSPENDED,
      reasonForStatusChange: "Overdue payment beyond grace period",
      statusChangedAt: new Date(),
      dueDayOfMonth: 10,
    },
  });

  const custTechSys = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      branchId: branchJohar.id,
      name: "TechSys Solutions (Pvt) Ltd",
      cnic: "35202-0001122-9",
      phone: "04235889900",
      whatsapp: "03008447788",
      email: "billing@techsys.pk",
      address: "Floor 3, Commercial Plaza, Johar Town",
      city: "Lahore",
      area: "Johar Town",
      staticIp: "203.0.113.45",
      pppoeUsername: "techsys_corp100",
      packageId: pkgCorp100M.id,
      monthlyFee: 12000,
      status: CustomerStatus.ACTIVE,
      dueDayOfMonth: 10,
    },
  });

  console.log("Created sample customers");

  // 8. Create Bills (Invoices)
  // Bill 1: Ali Khan (Paid)
  const billAli = await prisma.bill.create({
    data: {
      tenantId: tenant.id,
      customerId: custAli.id,
      periodMonth: "2026-07",
      amount: 2500,
      tax: 400,
      totalDue: 2900,
      dueDate: new Date(2026, 6, 10),
      status: BillStatus.PAID,
    },
  });

  // Bill 2: Usman (Unpaid)
  const billUsman = await prisma.bill.create({
    data: {
      tenantId: tenant.id,
      customerId: custUsman.id,
      periodMonth: "2026-07",
      amount: 1500,
      tax: 240,
      totalDue: 1740,
      dueDate: new Date(2026, 6, 10),
      status: BillStatus.UNPAID,
    },
  });

  // Bill 3: Fatima (Partial)
  const billFatima = await prisma.bill.create({
    data: {
      tenantId: tenant.id,
      customerId: custFatima.id,
      periodMonth: "2026-07",
      amount: 4500,
      tax: 720,
      totalDue: 5220,
      dueDate: new Date(2026, 6, 10),
      status: BillStatus.PARTIAL,
    },
  });

  // Bill 4: Tariq (Overdue)
  const billTariq = await prisma.bill.create({
    data: {
      tenantId: tenant.id,
      customerId: custTariq.id,
      periodMonth: "2026-07",
      amount: 2500,
      fine: 200,
      previousBalance: 2500,
      tax: 400,
      totalDue: 5600,
      dueDate: new Date(2026, 6, 10),
      status: BillStatus.UNPAID,
    },
  });

  // Bill 5: TechSys (Paid)
  const billTechSys = await prisma.bill.create({
    data: {
      tenantId: tenant.id,
      customerId: custTechSys.id,
      periodMonth: "2026-07",
      amount: 12000,
      tax: 1920,
      totalDue: 13920,
      dueDate: new Date(2026, 6, 10),
      status: BillStatus.PAID,
    },
  });

  console.log("Created monthly invoices");

  // 9. Record Payments
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      customerId: custAli.id,
      billId: billAli.id,
      amount: 2900,
      method: PaymentMethod.CASH,
      referenceNo: "REC-202607-001",
      receivedById: userCashier.id,
      receivedAt: new Date(2026, 6, 8),
    },
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      customerId: custFatima.id,
      billId: billFatima.id,
      amount: 3000,
      method: PaymentMethod.EASYPAISA,
      referenceNo: "EP-99887766",
      receivedById: userCashier.id,
      receivedAt: new Date(2026, 6, 9),
    },
  });

  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      customerId: custTechSys.id,
      billId: billTechSys.id,
      amount: 13920,
      method: PaymentMethod.BANK,
      referenceNo: "IBFT-HBL-11223344",
      receivedById: userOwner.id,
      receivedAt: new Date(2026, 6, 5),
    },
  });

  console.log("Recorded initial payments");

  // 10. Sample Reminders in NotificationQueue
  await prisma.notificationQueue.create({
    data: {
      tenantId: tenant.id,
      customerId: custUsman.id,
      channel: "WHATSAPP",
      templateKey: "BEFORE_DUE",
      payload: {
        name: custUsman.name,
        amount: "Rs. 1,740",
        date: "July 10, 2026",
      },
      status: NotificationStatus.SENT,
      sentAt: new Date(2026, 6, 7),
      attempts: 1,
    },
  });

  await prisma.notificationQueue.create({
    data: {
      tenantId: tenant.id,
      customerId: custTariq.id,
      channel: "WHATSAPP",
      templateKey: "OVERDUE",
      payload: {
        name: custTariq.name,
        amount: "Rs. 5,600",
        date: "July 10, 2026",
      },
      status: NotificationStatus.QUEUED,
      attempts: 0,
    },
  });

  // 11. Activity Log
  await prisma.activityLog.create({
    data: {
      tenantId: tenant.id,
      actorUserId: userCashier.id,
      action: "PAYMENT_RECORDED",
      entityType: "Payment",
      entityId: billAli.id,
      after: { amount: 2900, method: "CASH", customer: custAli.name },
    },
  });

  console.log("SmartISP database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
