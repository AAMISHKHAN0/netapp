"use client";

import * as React from "react";
import { RoleContext } from "../layout";
import { formatCurrency } from "@smartisp/utils";
import { getPayments } from "@/lib/actions";
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  CreditCard,
  Building,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";

interface PaymentRecord {
  id: string;
  receiptNo: string;
  customerName: string;
  amount: number;
  method: string;
  referenceNo: string;
  createdAt: string;
}

export default function ReportsPage() {
  const { tenantId, tenantName } = React.useContext(RoleContext);
  const [payments, setPayments] = React.useState<PaymentRecord[]>([]);

  const fetchReportsData = React.useCallback(async () => {
    try {
      const res = await getPayments(tenantId);
      if (res && res.length > 0) {
        setPayments(
          res.map((p: any) => ({
            id: p.id,
            receiptNo: p.receiptNo || `REC-${p.id.slice(0,6)}`,
            customerName: p.invoice?.customer?.name || "Unknown",
            amount: Number(p.amount),
            method: p.method,
            referenceNo: p.referenceNo || "-",
            createdAt: p.createdAt,
          }))
        );
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      console.error("Error loading report data:", err);
      setPayments([]);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const cashTotal = payments.filter((p) => p.method === "CASH").reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const digitalTotal = payments.filter((p) => p.method !== "CASH").reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Receipt No,Customer,Amount (PKR),Payment Method,TRX Reference,Date"].join(",") +
      "\n" +
      payments
        .map(
          (p) =>
            `${p.receiptNo},"${p.customerName}",${p.amount},${p.method},${p.referenceNo},${p.createdAt}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Income_Report_${tenantName}_2026-07.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Financial & Income Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time collection reports, cash drawer reconciliations, and CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV Report</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Net Revenue Collected</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(totalCollected)}</div>
          <span className="text-[10px] text-slate-400 font-medium">Live POS & Online Ledger</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Cash Drawer Total</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(cashTotal)}</div>
          <span className="text-[10px] text-slate-400 font-medium">Hand Cash in POS Counter</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Digital Wallet & Bank IBFT</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">{formatCurrency(digitalTotal)}</div>
          <span className="text-[10px] text-slate-400 font-medium">Easypaisa / JazzCash / Bank</span>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Live Itemized Payment Ledger ({payments.length} Transactions)</h2>
          <span className="text-xs text-blue-600 font-medium font-mono">Realtime Synced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-4">Receipt #</th>
                <th className="p-4">Subscriber</th>
                <th className="p-4">Amount (PKR)</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">TRX Ref #</th>
                <th className="p-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{pay.receiptNo}</td>
                  <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">{pay.customerName}</td>
                  <td className="p-4 font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(pay.amount)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      pay.method === "CASH"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {pay.method}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-500">{pay.referenceNo}</td>
                  <td className="p-4 text-right font-mono text-slate-500">
                    {new Date(pay.createdAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
