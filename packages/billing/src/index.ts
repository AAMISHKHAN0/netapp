export interface InvoiceCalculationInput {
  monthlyFee: number;
  taxPercent?: number;
  discount?: number;
  fine?: number;
  previousBalance?: number;
}

export interface InvoiceCalculationResult {
  amount: number;
  tax: number;
  discount: number;
  fine: number;
  previousBalance: number;
  totalDue: number;
}

/**
 * Calculates the exact breakdown and total due for a bill.
 * Formula: Total Due = Amount - Discount + Fine + Tax + Previous Balance
 */
export function calculateInvoiceBreakdown(
  input: InvoiceCalculationInput
): InvoiceCalculationResult {
  const amount = Math.max(0, input.monthlyFee);
  const discount = Math.max(0, input.discount ?? 0);
  const fine = Math.max(0, input.fine ?? 0);
  const taxPercent = Math.max(0, input.taxPercent ?? 0);
  
  const taxableSubtotal = Math.max(0, amount - discount);
  const tax = Math.round((taxableSubtotal * (taxPercent / 100)) * 100) / 100;
  const previousBalance = input.previousBalance ?? 0;
  
  const totalDue = Math.max(0, amount - discount + fine + tax + previousBalance);

  return {
    amount,
    tax,
    discount,
    fine,
    previousBalance,
    totalDue,
  };
}

/**
 * Determines updated bill status after a payment.
 */
export function computeBillStatusAfterPayment(
  totalDue: number,
  totalPaid: number
): "PAID" | "PARTIAL" | "UNPAID" {
  if (totalPaid >= totalDue) return "PAID";
  if (totalPaid > 0) return "PARTIAL";
  return "UNPAID";
}
