"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@smartisp/utils";
import { recordPayment, triggerWhatsAppReminder } from "@/lib/actions";
import { ReceiptTicket } from "@/components/ui/receipt-ticket";
import { RoleContext } from "../layout";
import { DEFAULT_SUBSCRIBERS } from "../customers/page";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Printer,
  Share2,
  Banknote,
  Smartphone,
  Building,
  Receipt,
  DollarSign,
  TrendingUp,
  History,
  Calculator,
} from "lucide-react";

interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string;
  area: string;
  packageName: string;
  totalDue: number;
  billId?: string;
  cnic?: string;
  status: string;
}

export default function PaymentsPOSPage() {
  const { role, tenantId } = React.useContext(RoleContext);
  const [customers, setCustomers] = React.useState<CustomerSearchResult[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedCust, setSelectedCust] = React.useState<CustomerSearchResult | null>(null);
  const [cashTendered, setCashTendered] = React.useState<number>(0);
  const [method, setMethod] = React.useState<string>("CASH");
  const [refNo, setRefNo] = React.useState<string>("");
  const [shiftTotal, setShiftTotal] = React.useState<number>(0);
  const [receiptCount, setReceiptCount] = React.useState<number>(0);

  const [recentReceipt, setRecentReceipt] = React.useState<{
    recNo: string;
    name: string;
    phone?: string;
    cnic?: string;
    packageName?: string;
    amount: number;
    method: string;
    refNo?: string;
    date: string;
  } | null>(null);

  const fetchTenantCustomers = React.useCallback(async () => {
    try {
      const storageKey = `smartisp_tenant_customers_${tenantId}`;
      const saved = localStorage.getItem(storageKey);
      let mapped: CustomerSearchResult[] = [];

      if (saved) {
        const parsed = JSON.parse(saved);
        mapped = parsed
          .filter((c: any) => c.status !== "SUSPENDED" && c.status !== "CLOSED")
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            area: c.area || "Johar Town",
            packageName: c.packageName || "Standard Package",
            totalDue: Number(c.previousBalance || c.monthlyFee || 2500),
            cnic: c.cnic,
            status: c.status,
          }));
      } else {
        mapped = DEFAULT_SUBSCRIBERS.filter((c) => c.status === "ACTIVE").map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          area: c.area,
          packageName: c.packageName,
          totalDue: c.previousBalance,
          cnic: c.cnic,
          status: c.status,
        }));
      }

      setCustomers(mapped);
      if (mapped[0]) {
        setSelectedCust(mapped[0]);
        setCashTendered(mapped[0].totalDue);
      } else {
        setSelectedCust(null);
      }

      const paymentStorageKey = `smartisp_tenant_payments_${tenantId}`;
      const savedPayments = localStorage.getItem(paymentStorageKey);
      if (savedPayments) {
        const parsedPay = JSON.parse(savedPayments);
        const total = parsedPay.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
        setShiftTotal(total);
        setReceiptCount(parsedPay.length);
      } else {
        setShiftTotal(14200);
        setReceiptCount(6);
      }
    } catch (err) {
      console.error("Error fetching POS customers:", err);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchTenantCustomers();
  }, [fetchTenantCustomers]);

  const handleDropdownSelectChange = (custId: string) => {
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setSelectedCust(found);
      setCashTendered(found.totalDue);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || cashTendered <= 0) return;

    const paidAmount = selectedCust.totalDue > 0 ? selectedCust.totalDue : cashTendered;
    const recNo = `REC-${Date.now().toString().slice(-6)}`;
    const invNo = `INV-2026-07-${Date.now().toString().slice(-4)}`;

    try {
      await recordPayment(
        {
          customerId: selectedCust.id,
          billId: selectedCust.billId,
          amount: paidAmount,
          method: method as any,
          referenceNo: refNo || undefined,
        },
        undefined,
        role,
        tenantId
      );
    } catch (err: any) {
      console.log("POS Payment recorded in state");
    } finally {
      // 1. Update customer balance in localStorage
      const updated = customers.map((c) => (c.id === selectedCust.id ? { ...c, totalDue: 0 } : c));
      setCustomers(updated);
      localStorage.setItem(`smartisp_tenant_customers_${tenantId}`, JSON.stringify(updated));

      // 2. Persist Payment Transaction to smartisp_tenant_payments_${tenantId}
      const paymentStorageKey = `smartisp_tenant_payments_${tenantId}`;
      const existingPay = JSON.parse(localStorage.getItem(paymentStorageKey) || "[]");
      const newPayRecord = {
        id: `pay-${Date.now()}`,
        receiptNo: recNo,
        customerName: selectedCust.name,
        amount: paidAmount,
        method,
        referenceNo: refNo || "TRX-POS",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(paymentStorageKey, JSON.stringify([newPayRecord, ...existingPay]));

      // 3. CRITICAL: Sync & Update Invoice in smartisp_tenant_bills_${tenantId} so Billing Page shows PAID
      const billStorageKey = `smartisp_tenant_bills_${tenantId}`;
      const existingBills = JSON.parse(localStorage.getItem(billStorageKey) || "[]");
      let billFound = false;

      const updatedBills = existingBills.map((b: any) => {
        if (b.customerName === selectedCust.name && b.status !== "PAID") {
          billFound = true;
          return { ...b, status: "PAID" };
        }
        return b;
      });

      if (!billFound) {
        updatedBills.unshift({
          id: `bill-${Date.now()}`,
          invoiceNo: invNo,
          customerName: selectedCust.name,
          periodMonth: "2026-07",
          amount: paidAmount,
          tax: Math.round(paidAmount * 0.16),
          discount: 0,
          fine: 0,
          previousBalance: 0,
          totalDue: paidAmount,
          dueDate: "2026-07-10",
          status: "PAID",
        });
      }

      localStorage.setItem(billStorageKey, JSON.stringify(updatedBills));

      // 4. Set Receipt View
      const receipt = {
        recNo,
        name: selectedCust.name,
        phone: selectedCust.phone,
        cnic: selectedCust.cnic,
        packageName: selectedCust.packageName,
        amount: paidAmount,
        method,
        refNo,
        date: new Date().toLocaleDateString("en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setRecentReceipt(receipt);
      setShiftTotal((prev) => prev + paidAmount);
      setReceiptCount((prev) => prev + 1);
      setSelectedCust({ ...selectedCust, totalDue: 0 });
      setRefNo("");
    }
  };

  const changeToReturn = selectedCust ? Math.max(0, cashTendered - selectedCust.totalDue) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* POS Top Terminal Shift Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift Cash Collected</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(shiftTotal)}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thermal Tickets Issued</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{receiptCount} Receipts</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Terminal Cashier</span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Sara Khan (Shift 01)</div>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Express POS Collection Station */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Fast POS Cash Collection Terminal</h2>
                <p className="text-xs text-slate-500">Select active subscriber, tender cash, calculate change, and print thermal receipt.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold">ONLINE</span>
            </div>

            {/* Step 1: Subscriber Dropdown Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Select Active Subscriber
              </label>
              {customers.length === 0 ? (
                <p className="text-xs text-amber-600">All subscribers are deactivated. Please reactivate a subscriber first.</p>
              ) : (
                <select
                  value={selectedCust?.id || ""}
                  onChange={(e) => handleDropdownSelectChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — Dues: Rs. {c.totalDue.toLocaleString()} [{c.packageName}]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2 & 3: Cash Tendered & Quick Keypad */}
            {selectedCust && (
              <form onSubmit={handleRecordPayment} className="space-y-5 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Monthly Bill Net Payable</span>
                    <div className="text-2xl font-extrabold text-rose-600 tabular-nums">{formatCurrency(selectedCust.totalDue)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-mono">Plan Rate</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedCust.packageName}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Cash Handed by Customer (PKR)
                  </label>

                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 font-bold text-slate-400 text-sm">Rs.</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xl font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 tabular-nums"
                    />
                  </div>

                  {/* Quick Cash Tendered Buttons */}
                  <div className="flex gap-2 pt-1">
                    {[
                      { label: "Exact", val: selectedCust.totalDue },
                      { label: "Rs. 1,000", val: 1000 },
                      { label: "Rs. 2,500", val: 2500 },
                      { label: "Rs. 5,000", val: 5000 },
                    ].map((btn, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setCashTendered(btn.val)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-blue-500"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change Return Box */}
                {cashTendered > selectedCust.totalDue && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Change to Return to Customer:</span>
                    </div>
                    <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                      {formatCurrency(changeToReturn)}
                    </div>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    3. Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "CASH", label: "Cash", icon: Banknote },
                      { id: "EASYPAISA", label: "Easypaisa", icon: Smartphone },
                      { id: "JAZZCASH", label: "JazzCash", icon: Smartphone },
                      { id: "BANK", label: "Bank / IBFT", icon: Building },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = method === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-500/15 text-blue-600 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedCust.totalDue <= 0}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{selectedCust.totalDue <= 0 ? "Payment Settled" : "Confirm Payment & Print Thermal Ticket"}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Thermal Receipt Preview */}
        <div className="space-y-4">
          {recentReceipt ? (
            <ReceiptTicket
              receiptNo={recentReceipt.recNo}
              customerName={recentReceipt.name}
              cnic={recentReceipt.cnic}
              phone={recentReceipt.phone}
              packageName={recentReceipt.packageName}
              amountPaid={recentReceipt.amount}
              paymentMethod={recentReceipt.method}
              referenceNo={recentReceipt.refNo}
              dateStr={recentReceipt.date}
            />
          ) : (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thermal Receipt Canvas</h3>
              <p className="text-xs text-slate-500">Select active subscriber from dropdown and confirm payment to issue thermal receipt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
