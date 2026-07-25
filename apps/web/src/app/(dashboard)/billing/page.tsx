"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { RoleContext } from "../layout";
import { formatCurrency, generateInvoiceNumber } from "@smartisp/utils";
import { DEFAULT_SUBSCRIBERS } from "@/lib/subscribers";
import { ReceiptTicket } from "@/components/ui/receipt-ticket";
import {
  Receipt,
  Plus,
  Printer,
  Search,
  CheckCircle,
  X,
  Calendar,
  User,
  CreditCard,
  Send,
  Eye,
  FileText,
  Zap,
  CheckCircle2,
  Users,
  MessageCircle,
  Trash2,
} from "lucide-react";

interface BillItem {
  id: string;
  invoiceNo: string;
  customerName: string;
  periodMonth: string;
  amount: number;
  tax: number;
  discount: number;
  fine: number;
  previousBalance: number;
  totalDue: number;
  dueDate: string;
  status: "PAID" | "UNPAID" | "PARTIAL" | "CANCELLED";
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  packageFee: number;
  status: string;
}

const formatWhatsAppPhone = (phone?: string) => {
  if (!phone) return "923004445566";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("03")) {
    return "92" + digits.slice(1);
  }
  if (digits.startsWith("923")) {
    return digits;
  }
  return digits || "923004445566";
};

export default function BillingPage() {
  const { role, tenantId } = React.useContext(RoleContext);
  const [bills, setBills] = React.useState<BillItem[]>([]);
  const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selectedBill, setSelectedBill] = React.useState<BillItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [receiptBill, setReceiptBill] = React.useState<BillItem | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = React.useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false);

  const [bulkDispatchProgress, setBulkDispatchProgress] = React.useState<number>(0);
  const [isBulkDispatching, setIsBulkDispatching] = React.useState<boolean>(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [amount, setAmount] = React.useState(2500);
  const [fine, setFine] = React.useState(0);
  const [discount, setDiscount] = React.useState(0);

  const deduplicateBills = (items: BillItem[]): BillItem[] => {
    const seen = new Map<string, BillItem>();
    items.forEach((item) => {
      const key = `${item.customerName.toLowerCase()}_${item.periodMonth}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        const existing = seen.get(key)!;
        if (item.status === "PAID" && existing.status !== "PAID") {
          seen.set(key, item);
        }
      }
    });
    return Array.from(seen.values());
  };

  const fetchTenantData = React.useCallback(() => {
    try {
      const custStorageKey = `smartisp_tenant_customers_${tenantId}`;
      const savedCusts = localStorage.getItem(custStorageKey);
      let loadedCusts: CustomerOption[] = [];

      if (savedCusts) {
        const parsed = JSON.parse(savedCusts);
        loadedCusts = parsed
          .filter((c: any) => c.status !== "SUSPENDED" && c.status !== "CLOSED")
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            packageFee: Number(c.monthlyFee || 2500),
            status: c.status,
          }));
      } else {
        loadedCusts = DEFAULT_SUBSCRIBERS.filter((c) => c.status === "ACTIVE").map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          packageFee: c.monthlyFee,
          status: c.status,
        }));
      }

      setCustomerOptions(loadedCusts);
      if (loadedCusts[0]) {
        setSelectedCustomerId(loadedCusts[0].id);
        setAmount(loadedCusts[0].packageFee);
      }

      const billStorageKey = `smartisp_tenant_bills_${tenantId}`;
      const savedBills = localStorage.getItem(billStorageKey);
      let activeBills: BillItem[] = [];

      if (savedBills) {
        activeBills = JSON.parse(savedBills);
      } else {
        activeBills = DEFAULT_SUBSCRIBERS.map((c, i) => ({
          id: `bill-${i + 1}`,
          invoiceNo: `INV-2026-07-000${i + 1}`,
          customerName: c.name,
          periodMonth: "2026-07",
          amount: c.monthlyFee,
          tax: Math.round(c.monthlyFee * 0.16),
          discount: 0,
          fine: 0,
          previousBalance: 0,
          totalDue: Math.round(c.monthlyFee * 1.16),
          dueDate: "2026-07-10",
          status: i === 0 ? "PAID" : "UNPAID",
        }));
      }

      const cleaned = deduplicateBills(activeBills);
      setBills(cleaned);
      localStorage.setItem(billStorageKey, JSON.stringify(cleaned));
    } catch (err) {
      console.error("Error fetching tenant invoices:", err);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCustomerSelectChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customerOptions.find((c) => c.id === custId);
    if (found) {
      setAmount(found.packageFee);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.invoiceNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleMarkAsPaid = (bill: BillItem) => {
    const updated = bills.map((b) => (b.id === bill.id ? { ...b, status: "PAID" as const } : b));
    const cleaned = deduplicateBills(updated);
    setBills(cleaned);
    localStorage.setItem(`smartisp_tenant_bills_${tenantId}`, JSON.stringify(cleaned));

    if (selectedBill?.id === bill.id) {
      setSelectedBill({ ...selectedBill, status: "PAID" });
    }

    setReceiptBill({ ...bill, status: "PAID" });
    setIsDetailsModalOpen(false);
    showToast(`Invoice '${bill.invoiceNo}' marked as PAID! Thermal receipt issued.`);
  };

  const handleOpenDetails = (bill: BillItem) => {
    setSelectedBill(bill);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteBill = (billId: string) => {
    const updated = bills.filter((b) => b.id !== billId);
    setBills(updated);
    localStorage.setItem(`smartisp_tenant_bills_${tenantId}`, JSON.stringify(updated));
    showToast("Duplicate invoice removed!");
  };

  // --- PRINT PDF RECEIPT ONLY (Opens /receipt page, not full dashboard) ---
  const handlePrintPdfReceipt = (bill: BillItem) => {
    const targetCust = customerOptions.find((c) => c.name === bill.customerName);
    const phone = targetCust?.phone || "03004445566";
    const pdfUrl = `http://localhost:3000/receipt?rec=${bill.invoiceNo}&name=${encodeURIComponent(bill.customerName)}&phone=${phone}&plan=Standard&amount=${bill.totalDue}&date=2026-07-25&autoprint=true`;
    window.open(pdfUrl, "_blank");
  };

  const handleSendWhatsAppInvoice = (bill: BillItem) => {
    const targetCust = customerOptions.find((c) => c.name === bill.customerName);
    const cleanPhone = formatWhatsAppPhone(targetCust?.phone || "03004445566");
    const pdfUrl = `http://localhost:3000/receipt?rec=${bill.invoiceNo}&name=${encodeURIComponent(bill.customerName)}&phone=${cleanPhone}&plan=Standard&amount=${bill.totalDue}&date=2026-07-25`;

    const msg =
      `🌐 *SmartISP Fiber Network*\n` +
      `*Official Monthly Invoice Notice*\n` +
      `--------------------------------------\n` +
      `🧾 *INVOICE #: ${bill.invoiceNo}*\n` +
      `👤 Customer: *${bill.customerName}*\n` +
      `📅 Billing Period: ${bill.periodMonth}\n` +
      `💰 Amount Due: *Rs. ${bill.totalDue.toLocaleString()}*\n` +
      `--------------------------------------\n` +
      `📄 *View / Download Colorful PDF Invoice:* ${pdfUrl}\n\n` +
      `Please settle your bill via POS Counter or Bank IBFT. Thank you!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    showToast(`Opening WhatsApp for ${bill.customerName}...`);
  };

  const handleBulkGenerateInvoices = () => {
    const newBulkBills: BillItem[] = customerOptions.map((cust, idx) => {
      const tax = Math.round(cust.packageFee * 0.16);
      const totalDue = cust.packageFee + tax;
      return {
        id: `bill-bulk-${Date.now()}-${idx}`,
        invoiceNo: generateInvoiceNumber("2026-07", bills.length + idx + 1),
        customerName: cust.name,
        periodMonth: "2026-07",
        amount: cust.packageFee,
        tax,
        discount: 0,
        fine: 0,
        previousBalance: 0,
        totalDue,
        dueDate: "2026-07-10",
        status: "UNPAID",
      };
    });

    const cleaned = deduplicateBills([...newBulkBills, ...bills]);
    setBills(cleaned);
    localStorage.setItem(`smartisp_tenant_bills_${tenantId}`, JSON.stringify(cleaned));
    showToast(`⚡ Cleaned & Synced Monthly Invoices for Active Subscribers!`);
  };

  const handleBatchDispatchWhatsApp = async () => {
    setIsBulkDispatching(true);
    setBulkDispatchProgress(0);

    for (let i = 0; i < customerOptions.length; i++) {
      const cust = customerOptions[i];
      setBulkDispatchProgress(i + 1);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsBulkDispatching(false);
    showToast(`✅ Batch Dispatched WhatsApp Invoices to ${customerOptions.length} Subscribers!`);
  };

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedCust = customerOptions.find((c) => c.id === selectedCustomerId);
    const custName = selectedCust ? selectedCust.name : "Subscriber";
    const tax = Math.round(amount * 0.16);
    const totalDue = amount + tax + fine - discount;
    const invNo = generateInvoiceNumber("2026-07", bills.length + 1);

    const newBill: BillItem = {
      id: `bill-${Date.now()}`,
      invoiceNo: invNo,
      customerName: custName,
      periodMonth: "2026-07",
      amount,
      tax,
      discount,
      fine,
      previousBalance: 0,
      totalDue,
      dueDate: "2026-07-10",
      status: "UNPAID",
    };

    const cleaned = deduplicateBills([newBill, ...bills]);
    setBills(cleaned);
    localStorage.setItem(`smartisp_tenant_bills_${tenantId}`, JSON.stringify(cleaned));
    setIsManualModalOpen(false);
    setLoading(false);
    showToast(`Invoice '${newBill.invoiceNo}' generated!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Billing & Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auto-generate monthly bills, deduplicate active accounts, bulk dispatch WhatsApp invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs transition-all shadow-md shadow-orange-500/20"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ Bulk Invoicing & WhatsApp Batch</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create One Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice # or Customer Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["ALL", "UNPAID", "PARTIAL", "PAID"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      <div className="grid grid-cols-1 gap-6">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Total Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions Menu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    onClick={() => handleOpenDetails(bill)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      selectedBill?.id === bill.id ? "bg-blue-50/40 dark:bg-blue-500/10" : ""
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {bill.invoiceNo}
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      {bill.customerName}
                    </td>
                    <td className="p-4 text-slate-500">{bill.periodMonth}</td>
                    <td className="p-4 font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(bill.totalDue)}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          bill.status === "PAID"
                            ? "paid"
                            : bill.status === "PARTIAL"
                            ? "pending"
                            : "overdue"
                        }
                      >
                        {bill.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {bill.status !== "PAID" && (
                          <button
                            onClick={() => handleMarkAsPaid(bill)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                            title="Collect Payment & Mark PAID"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Now</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDetails(bill)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-1 font-semibold text-[11px]"
                          title="View Invoice Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsAppInvoice(bill)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                          title="Send WhatsApp Invoice Notice"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrintPdfReceipt(bill)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Print Dedicated PDF Receipt Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Remove Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- BULK INVOICING & BATCH WHATSAPP DISPATCH MODAL --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Bulk Monthly Invoicing & WhatsApp Batch Dispatch
                  </h2>
                  <p className="text-xs text-slate-500">Auto-generate invoices for all active subscribers & send PDF links.</p>
                </div>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Users className="w-4 h-4 text-blue-600" /> Active Subscribers:
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{customerOptions.length} Accounts</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Billing Month:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">July 2026</span>
                </div>
              </div>

              {isBulkDispatching && (
                <div className="space-y-1.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 text-xs">
                  <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300">
                    <span>Dispatching WhatsApp Invoices...</span>
                    <span>{bulkDispatchProgress} / {customerOptions.length}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-emerald-200 dark:bg-emerald-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${(bulkDispatchProgress / customerOptions.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleBulkGenerateInvoices}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                >
                  <Zap className="w-4 h-4" /> 1-Click Auto-Generate Monthly Invoices ({customerOptions.length})
                </button>

                <button
                  onClick={handleBatchDispatchWhatsApp}
                  disabled={isBulkDispatching}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" /> Batch Send WhatsApp PDF Receipts to All ({customerOptions.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- INVOICE DETAILS INTERACTIVE MODAL --- */}
      {isDetailsModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Invoice Details: {selectedBill.invoiceNo}
                  </h2>
                  <p className="text-[11px] text-slate-500">Period: {selectedBill.periodMonth}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subscriber Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedBill.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Month:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedBill.periodMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedBill.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Status:</span>
                  <Badge variant={selectedBill.status === "PAID" ? "paid" : "overdue"}>
                    {selectedBill.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Package Base Fee:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(selectedBill.amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST Tax (16%):</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(selectedBill.tax)}</span>
                </div>
                {selectedBill.fine > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Late Fee Fine:</span>
                    <span className="font-semibold tabular-nums">+{formatCurrency(selectedBill.fine)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  <span>Total Amount Due:</span>
                  <span className="tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(selectedBill.totalDue)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2">
              {selectedBill.status !== "PAID" ? (
                <button
                  onClick={() => handleMarkAsPaid(selectedBill)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CreditCard className="w-4 h-4" /> Collect & Pay
                </button>
              ) : (
                <button
                  onClick={() => handleSendWhatsAppInvoice(selectedBill)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" /> Send WhatsApp
                </button>
              )}
              <button
                onClick={() => handlePrintPdfReceipt(selectedBill)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" /> Print Dedicated PDF Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual invoice modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Create One-Off Manual Invoice</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Select Active Subscriber
                </label>
                {customerOptions.length === 0 ? (
                  <p className="text-xs text-amber-600">All subscribers are deactivated or closed. Please activate a subscriber first.</p>
                ) : (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelectChange(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — Fee: Rs. {c.packageFee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Charge Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Late Fine (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={fine}
                    onChange={(e) => setFine(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || customerOptions.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  {loading ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
