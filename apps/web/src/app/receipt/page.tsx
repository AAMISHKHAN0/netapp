"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Wifi, CheckCircle2, Printer, Download, Share2, ShieldCheck, ArrowLeft, FileText } from "lucide-react";
import { formatCurrency } from "@smartisp/utils";
import Link from "next/link";

export default function ReceiptPrintPDFPage() {
  const searchParams = useSearchParams();

  const receiptNo = searchParams.get("rec") || "REC-849759";
  const customerName = searchParams.get("name") || "Ali Raza Khan";
  const phone = searchParams.get("phone") || "03004445566";
  const packageName = searchParams.get("plan") || "Home Standard 20Mbps";
  const amountStr = searchParams.get("amount") || "2900";
  const amountPaid = Number(amountStr);
  const method = searchParams.get("method") || "CASH";
  const dateStr = searchParams.get("date") || "25 Jul 2026, 06:24 pm";
  const autoPrint = searchParams.get("autoprint") === "true";

  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 print:hidden">
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Operations
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all"
        >
          <Printer className="w-4 h-4" /> Download / Print PDF Receipt
        </button>
      </div>

      {/* Colorful High-End PDF Thermal Receipt Ticket Container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:w-full">
        {/* Vibrant Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 border border-white/20 shadow-inner">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">SmartISP Fiber Network</h1>
          <p className="text-xs text-blue-100 font-medium">Official Digital PDF Payment Receipt</p>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status & Barcode Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Receipt #</span>
              <div className="font-mono font-extrabold text-base text-slate-900 dark:text-slate-100">{receiptNo}</div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> PAID & SETTLED
              </span>
            </div>
          </div>

          {/* Subscriber Profile Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Subscriber Profile</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">{customerName}</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">PHONE</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PACKAGE TIER</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{packageName}</span>
              </div>
            </div>
          </div>

          {/* Charges Itemization Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Itemized Charges Breakdown</span>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Monthly Bandwidth Charge:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(amountPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Payment Method:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{method}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Transaction Date:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Total Net Settled Highlight Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center space-y-1 shadow-lg shadow-blue-600/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Total Net Amount Settled</span>
            <div className="text-3xl font-black tabular-nums">{formatCurrency(amountPaid)}</div>
          </div>

          {/* Direct Save PDF Button */}
          <div className="print:hidden pt-1">
            <button
              onClick={handlePrint}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-4 h-4" /> Save / Download Official PDF Receipt
            </button>
          </div>

          {/* Cashier Footer Signature */}
          <div className="text-center text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <p className="text-[11px]">Authorized Cashier: <span className="font-bold text-slate-700 dark:text-slate-300">Sara Khan (Branch 01)</span></p>
            <p className="text-[10px] text-slate-400">SmartISP Pakistan · Support Hotline: (042) 111-762-784</p>
          </div>
        </div>
      </div>
    </div>
  );
}
