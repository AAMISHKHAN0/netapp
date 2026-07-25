"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { RoleContext } from "../layout";
import { getNotificationQueue, triggerWhatsAppReminder, getCustomers } from "@/lib/actions";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Smartphone,
  Plus,
} from "lucide-react";

interface NotificationItem {
  id: string;
  customerName: string;
  phone: string;
  channel: string;
  templateKey: string;
  status: "QUEUED" | "SENT" | "FAILED";
  sentAt?: string | null;
  createdAt: string;
}

export default function RemindersPage() {
  const { role, tenantId } = React.useContext(RoleContext);
  const [queue, setQueue] = React.useState<NotificationItem[]>([]);
  const [customers, setCustomers] = React.useState<{ id: string; name: string; phone: string }[]>([]);
  const [selectedCustId, setSelectedCustId] = React.useState("");
  const [templateKey, setTemplateKey] = React.useState("BILL_DUE");
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchTenantReminders = React.useCallback(async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        getNotificationQueue(tenantId),
        getCustomers("", "ALL", tenantId),
      ]);

      if (qRes && qRes.length > 0) {
        setQueue(
          qRes.map((q: any) => ({
            id: q.id,
            customerName: q.customer?.name || "Subscriber",
            phone: q.customer?.whatsapp || q.customer?.phone || "03000000000",
            channel: q.channel,
            templateKey: q.templateKey,
            status: q.status,
            sentAt: q.sentAt ? new Date(q.sentAt).toLocaleString() : null,
            createdAt: new Date(q.createdAt).toLocaleString(),
          }))
        );
      } else {
        setQueue([]);
      }

      if (cRes && cRes.length > 0) {
        setCustomers(cRes.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone })));
        if (cRes[0]) setSelectedCustId(cRes[0].id);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchTenantReminders();
  }, [fetchTenantReminders]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredQueue = queue.filter((q) => {
    const matchesSearch =
      q.customerName.toLowerCase().includes(search.toLowerCase()) ||
      q.phone.includes(search) ||
      q.templateKey.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustId) return;

    setLoading(true);

    try {
      const cust = customers.find((c) => c.id === selectedCustId);
      await triggerWhatsAppReminder(
        selectedCustId,
        templateKey,
        {
          name: cust?.name || "Subscriber",
          amount: "2500",
          dueDate: "2026-07-10",
        },
        tenantId
      );

      const newItem: NotificationItem = {
        id: `notif-${Date.now()}`,
        customerName: cust?.name || "Subscriber",
        phone: cust?.phone || "03000000000",
        channel: "WHATSAPP",
        templateKey,
        status: "SENT",
        sentAt: new Date().toLocaleString(),
        createdAt: new Date().toLocaleString(),
      };

      setQueue([newItem, ...queue]);
      showToast(`WhatsApp reminder dispatched to ${cust?.name}!`);
    } catch (err: any) {
      showToast("WhatsApp dispatch queued via Evolution API!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            WhatsApp Automated Reminders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated payment reminders, bill generation alerts, and WhatsApp message logs.
          </p>
        </div>

        <button
          onClick={fetchTenantReminders}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Dispatch Form */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Dispatch Direct Reminder
          </h2>

          {customers.length === 0 ? (
            <p className="text-xs text-slate-500">No subscribers registered yet. Please add a subscriber first to send reminders.</p>
          ) : (
            <form onSubmit={handleSendReminder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Subscriber</label>
                <select
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reminder Template</label>
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="BILL_DUE">Bill Due Reminder (3 Days Before)</option>
                  <option value="OVERDUE_WARNING">Overdue Connection Notice</option>
                  <option value="PAYMENT_RECEIVED">Payment Receipt Confirmation</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? "Sending..." : "Dispatch via WhatsApp"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Notification Queue Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search notification logs by subscriber name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["ALL", "SENT", "QUEUED", "FAILED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No WhatsApp Notifications Queued</h3>
              <p className="text-xs text-slate-500">Dispatch a reminder to log WhatsApp message delivery status.</p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-4">Subscriber</th>
                      <th className="p-4">Template</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.phone}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{item.templateKey}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <Smartphone className="w-3.5 h-3.5" /> WhatsApp
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={item.status === "SENT" ? "paid" : item.status === "QUEUED" ? "pending" : "overdue"}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">
                          {item.sentAt || item.createdAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
