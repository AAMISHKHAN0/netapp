/**
 * Format currency amounts into standard PKR / Rs. representation.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace("PKR", "Rs.");
}

/**
 * Mask sensitive CNIC numbers by default per TRD §14 (e.g. 35202-1234567-1 -> 35202-*******-1).
 */
export function maskCNIC(cnic: string): string {
  if (!cnic || cnic.length < 15) return cnic;
  const parts = cnic.split("-");
  if (parts.length !== 3) return cnic;
  return `${parts[0]}-*******-${parts[2]}`;
}

/**
 * Format month string YYYY-MM to readable label e.g., "July 2026".
 */
export function formatMonthYear(periodMonth: string): string {
  const [year, month] = periodMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Generate human-readable invoice reference number (e.g. INV-2026-07-0042).
 */
export function generateInvoiceNumber(periodMonth: string, sequence: number): string {
  const seqStr = sequence.toString().padStart(4, "0");
  return `INV-${periodMonth}-${seqStr}`;
}
