import { z } from "zod";

// --- Customer Schemas ---
export const CustomerStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "PENDING", "CLOSED"]);

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must follow format 12345-1234567-1"),
  phone: z.string().min(10, "Phone number must be valid"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  photoUrl: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().default("Lahore"),
  area: z.string().min(2, "Area is required"),
  street: z.string().optional(),
  houseNo: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  onuMac: z.string().optional(),
  routerMac: z.string().optional(),
  staticIp: z.string().optional(),
  pppoeUsername: z.string().optional(),
  pppoePassword: z.string().optional(),
  packageId: z.string().uuid("Invalid package ID"),
  branchId: z.string().uuid("Invalid branch ID"),
  monthlyFee: z.number().positive("Monthly fee must be positive"),
  installationCharge: z.number().nonnegative().default(0),
  securityDeposit: z.number().nonnegative().default(0),
  previousBalance: z.number().default(0),
  dueDayOfMonth: z.number().int().min(1).max(28).default(10),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  id: z.string().uuid(),
});

export const ChangeCustomerStatusSchema = z.object({
  customerId: z.string().uuid(),
  status: CustomerStatusEnum,
  reason: z.string().min(3, "Reason for status change is required"),
});

// --- Package Schemas ---
export const CreatePackageSchema = z.object({
  name: z.string().min(2, "Package name is required"),
  downloadSpeed: z.number().positive("Download speed must be positive"),
  uploadSpeed: z.number().positive("Upload speed must be positive"),
  price: z.number().positive("Price must be positive"),
  taxPercent: z.number().nonnegative().default(0),
  fupGb: z.number().positive().optional(),
  description: z.string().optional(),
  isCorporate: z.boolean().default(false),
});

export const UpdatePackageSchema = CreatePackageSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

// --- Billing Schemas ---
export const BillStatusEnum = z.enum(["UNPAID", "PARTIAL", "PAID", "CANCELLED"]);

export const CreateManualInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
  amount: z.number().positive(),
  discount: z.number().nonnegative().default(0),
  fine: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  previousBalance: z.number().default(0),
  dueDate: z.string().or(z.date()),
});

export const GenerateMonthlyBillsSchema = z.object({
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
  dueDate: z.string().or(z.date()),
  branchId: z.string().uuid().optional(),
});

// --- Payment Schemas ---
export const PaymentMethodEnum = z.enum([
  "CASH",
  "BANK",
  "EASYPAISA",
  "JAZZCASH",
  "CARD",
  "ONLINE",
]);

export const RecordPaymentSchema = z.object({
  customerId: z.string().uuid(),
  billId: z.string().uuid().optional(),
  amount: z.number().positive("Payment amount must be greater than 0"),
  method: PaymentMethodEnum,
  referenceNo: z.string().optional(),
  receivedAt: z.string().or(z.date()).optional(),
});

// --- Reminder Schemas ---
export const TriggerReminderSchema = z.object({
  customerId: z.string().uuid(),
  templateKey: z.enum(["BEFORE_DUE", "DUE_TODAY", "OVERDUE", "PAYMENT_RECEIVED"]),
  customVariables: z.record(z.string()).optional(),
});

// --- Auth & Staff Schemas ---
export const LoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;
export type CreateManualInvoiceInput = z.infer<typeof CreateManualInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
