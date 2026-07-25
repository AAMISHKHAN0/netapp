"use client";

import * as React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { RoleContext } from "../layout";
import { formatCurrency } from "@smartisp/utils";
import { getDashboardMetrics } from "@/lib/actions";
import { DEFAULT_SUBSCRIBERS } from "@/lib/subscribers";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Server,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const { role, tenantId, tenantName } = React.useContext(RoleContext);
  const [metrics, setMetrics] = React.useState<any>(null);

  const fetchMetrics = React.useCallback(async () => {
    try {
      // 1. Calculate live customer metrics
      const savedCusts = localStorage.getItem(`smartisp_tenant_customers_${tenantId}`);
      const custs = savedCusts ? JSON.parse(savedCusts) : DEFAULT_SUBSCRIBERS;
      const activeCount = custs.filter((c: any) => c.status === "ACTIVE").length;

      // 2. Calculate live payments collected
      const savedPays = localStorage.getItem(`smartisp_tenant_payments_${tenantId}`);
      const payList = savedPays ? JSON.parse(savedPays) : [];
      const totalCollections = payList.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

      // 3. Server action fallback
      const serverRes = await getDashboardMetrics(tenantId);

      setMetrics({
        monthlyRevenue: (serverRes?.monthlyRevenue || 45200) + totalCollections,
        activeSubscribers: activeCount || serverRes?.activeSubscribers || 4,
        overdueUnpaidBills: serverRes?.overdueUnpaidBills || 1,
        totalCollectionsThisMonth: (serverRes?.totalCollectionsThisMonth || 14200) + totalCollections,
        routerOnlineStatus: true,
        cpuUsage: 14,
        ramUsage: 32,
      });
    } catch (err) {
      setMetrics({
        monthlyRevenue: 59400,
        activeSubscribers: 4,
        overdueUnpaidBills: 1,
        totalCollectionsThisMonth: 14200,
        routerOnlineStatus: true,
        cpuUsage: 14,
        ramUsage: 32,
      });
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const chartData = [
    { month: "Jan", revenue: 32000, collections: 28000 },
    { month: "Feb", revenue: 38000, collections: 34000 },
    { month: "Mar", revenue: 41000, collections: 39000 },
    { month: "Apr", revenue: 45000, collections: 42000 },
    { month: "May", revenue: 49000, collections: 46000 },
    { month: "Jun", revenue: 53000, collections: 51000 },
    { month: "Jul", revenue: metrics?.monthlyRevenue || 59400, collections: metrics?.totalCollectionsThisMonth || 14200 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
                {tenantName} Workspace
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-mono">
                MikroTik Router Board Online
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">ISP Operations Dashboard</h1>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              Live bandwidth monitoring, billing collections, subscriber directory status, and real-time revenue analytics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-blue-200 uppercase font-mono block">Router CPU Load</span>
              <span className="text-lg font-extrabold tabular-nums">14% (Low)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(metrics?.monthlyRevenue || 59400)}
          icon={DollarSign}
          trend="+14.2% vs last month"
          trendUp={true}
        />
        <StatCard
          title="Active Subscribers"
          value={`${metrics?.activeSubscribers || 4} Connected`}
          icon={Users}
          trend="100% SLA uptime"
          trendUp={true}
        />
        <StatCard
          title="Overdue Unpaid Bills"
          value={`${metrics?.overdueUnpaidBills || 1} Accounts`}
          icon={AlertTriangle}
          trend="Automated reminders"
          trendUp={false}
        />
        <StatCard
          title="Total Cash Collected"
          value={formatCurrency(metrics?.totalCollectionsThisMonth || 14200)}
          icon={Activity}
          trend="Live POS & Online Bank"
          trendUp={true}
        />
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Monthly Revenue vs Collections Trend</h3>
              <p className="text-xs text-slate-500">Live collection comparison across past billing cycles.</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} stroke="#94a3b8" fontSize={11} />
                <YAxis tickLine={false} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Router Hardware Monitor */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-600" /> Core Router Node
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">ONLINE</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>CPU Load:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">14%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600 w-[14%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>RAM Memory:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">32%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-600 w-[32%]" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-mono font-semibold">MikroTik CCR1036-12G-4S</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Throughput:</span>
                <span className="font-mono font-semibold text-emerald-600">8.4 Gbps / 10 Gbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
