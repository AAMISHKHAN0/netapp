"use client";

import * as React from "react";
import { formatCurrency, maskCNIC } from "@smartisp/utils";
import { Wifi, Printer, Share2, CheckCircle2, FileText, Download } from "lucide-react";

export interface ReceiptTicketProps {
  receiptNo: string;
  customerName: string;
  cnic?: string;
  phone?: string;
  area?: string;
  packageName?: string;
  amountPaid: number;
  paymentMethod: string;
  referenceNo?: string;
  dateStr: string;
  receivedBy?: string;
  onPrint?: () => void;
  onShareWhatsApp?: () => void;
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

export function ReceiptTicket({
  receiptNo,
  customerName,
  cnic,
  phone = "03004445566",
  area = "Johar Town",
  packageName = "Home Standard 20Mbps",
  amountPaid,
  paymentMethod,
  referenceNo,
  dateStr,
  receivedBy = "Sara Khan (Cashier)",
  onPrint,
  onShareWhatsApp,
}: ReceiptTicketProps) {
  const pdfViewUrl = `http://localhost:3000/receipt?rec=${receiptNo}&name=${encodeURIComponent(customerName)}&phone=${phone}&plan=${encodeURIComponent(packageName)}&amount=${amountPaid}&method=${paymentMethod}&date=${encodeURIComponent(dateStr)}&autoprint=true`;

  const handleDownloadPdfFile = () => {
    window.open(pdfViewUrl, "_blank");
  };

  const handleWhatsAppRedirect = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp();
    }
    const cleanPhone = formatWhatsAppPhone(phone);
    const maskedCnic = cnic ? maskCNIC(cnic) : "35202-*******-1";

    const msg =
      `🌐 *SmartISP Fiber Network*\n` +
      `*Official Payment Thermal Receipt*\n` +
      `--------------------------------------\n` +
      `🧾 *RECEIPT #: ${receiptNo}*  [🟢 PAID]\n\n` +
      `👤 *SUBSCRIBER INFORMATION*\n` +
      `• Name: *${customerName}*\n` +
      `• CNIC: ${maskedCnic}\n` +
      `• Phone: ${phone}\n` +
      `• Plan: *${packageName}* (${area})\n\n` +
      `💳 *PAYMENT BREAKDOWN*\n` +
      `• Amount Received: *Rs. ${amountPaid.toLocaleString()}*\n` +
      `• Payment Method: *${paymentMethod}*\n` +
      (referenceNo ? `• Ref / TRX ID: ${referenceNo}\n` : "") +
      `• Date & Time: ${dateStr}\n\n` +
      `💰 *TOTAL NET SETTLED: Rs. ${amountPaid.toLocaleString()}*\n` +
      `--------------------------------------\n` +
      `📄 *Download Official PDF Receipt Document:* ${pdfViewUrl}\n\n` +
      `✍️ Received by: *${receivedBy}*\n` +
      `Thank you for choosing SmartISP!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
      {/* Receipt Header Banner */}
      <div className="bg-blue-600 p-4 text-white text-center space-y-1">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-1">
          <Wifi className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-extrabold text-base tracking-tight">SmartISP Network</h3>
        <p className="text-[11px] text-blue-100 font-medium">Official Payment Thermal Receipt</p>
      </div>

      {/* Ticket Details Body */}
      <div className="p-5 space-y-4 text-xs">
        {/* Receipt No & Status */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt #</span>
            <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{receiptNo}</div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID
          </span>
        </div>

        {/* Subscriber Info */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscriber Information</span>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{customerName}</div>
            {cnic && <div className="text-slate-500 font-mono">CNIC: {maskCNIC(cnic)}</div>}
            {phone && <div className="text-slate-500 font-mono">Phone: {phone}</div>}
            <div className="text-slate-500">Plan: <span className="font-semibold text-slate-700 dark:text-slate-300">{packageName}</span> ({area})</div>
          </div>
        </div>

        {/* Payment & Charges Breakdown */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Breakdown</span>
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Amount Received:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(amountPaid)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Payment Method:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{paymentMethod}</span>
            </div>
            {referenceNo && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400 font-mono">
                <span>Ref / TRX ID:</span>
                <span className="text-slate-800 dark:text-slate-200">{referenceNo}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Date & Time:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Amount Paid Highlight Box */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-center space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Total Net Settled</span>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tabular-nums">
            {formatCurrency(amountPaid)}
          </div>
        </div>

        {/* 1-Click Save / Download PDF Document Button */}
        <button
          type="button"
          onClick={handleDownloadPdfFile}
          className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Receipt File ({receiptNo}.pdf)</span>
        </button>

        {/* Cashier Footer */}
        <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p>Received by: <span className="font-semibold text-slate-700 dark:text-slate-300">{receivedBy}</span></p>
          <p className="mt-0.5">Thank you for choosing SmartISP!</p>
        </div>

        {/* Thermal Print & WhatsApp Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onPrint || handleDownloadPdfFile}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={handleWhatsAppRedirect}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp Link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
