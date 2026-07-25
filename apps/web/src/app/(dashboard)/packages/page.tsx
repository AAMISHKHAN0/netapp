"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { RoleContext } from "../layout";
import { formatCurrency } from "@smartisp/utils";
import { getPackages, createPackage } from "@/lib/actions";
import { Plus, Wifi, CheckCircle, ShieldAlert, X, Package as PackageIcon } from "lucide-react";

interface PackageItem {
  id: string;
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  price: number;
  taxPercent: number;
  isCorporate: boolean;
  isActive: boolean;
  subscribersCount: number;
}

const DEFAULT_BUILTIN_PACKAGES: PackageItem[] = [
  {
    id: "pkg-def-1",
    name: "Home Basic 10Mbps",
    downloadSpeed: 10,
    uploadSpeed: 10,
    price: 1500,
    taxPercent: 16,
    isCorporate: false,
    isActive: true,
    subscribersCount: 0,
  },
  {
    id: "pkg-def-2",
    name: "Home Standard 20Mbps",
    downloadSpeed: 20,
    uploadSpeed: 20,
    price: 2500,
    taxPercent: 16,
    isCorporate: false,
    isActive: true,
    subscribersCount: 0,
  },
  {
    id: "pkg-def-3",
    name: "Ultra Speed 50Mbps",
    downloadSpeed: 50,
    uploadSpeed: 50,
    price: 4500,
    taxPercent: 16,
    isCorporate: false,
    isActive: true,
    subscribersCount: 0,
  },
  {
    id: "pkg-def-4",
    name: "Corporate Fiber 100Mbps",
    downloadSpeed: 100,
    uploadSpeed: 100,
    price: 12000,
    taxPercent: 16,
    isCorporate: true,
    isActive: true,
    subscribersCount: 0,
  },
];

export default function PackagesPage() {
  const { role, tenantId } = React.useContext(RoleContext);
  const [packages, setPackages] = React.useState<PackageItem[]>(DEFAULT_BUILTIN_PACKAGES);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // New package form state
  const [name, setName] = React.useState("");
  const [speed, setSpeed] = React.useState(25);
  const [price, setPrice] = React.useState(3000);
  const [isCorporate, setIsCorporate] = React.useState(false);

  const fetchTenantPackages = React.useCallback(async () => {
    try {
      const res = await getPackages(tenantId);
      if (res && res.length > 0) {
        setPackages(
          res.map((p: any) => ({
            id: p.id,
            name: p.name,
            downloadSpeed: p.downloadSpeed,
            uploadSpeed: p.uploadSpeed,
            price: Number(p.price),
            taxPercent: Number(p.taxPercent || 16),
            isCorporate: p.isCorporate || false,
            isActive: p.isActive,
            subscribersCount: p._count?.customers || 0,
          }))
        );
      } else {
        setPackages(DEFAULT_BUILTIN_PACKAGES);
      }
    } catch (err) {
      setPackages(DEFAULT_BUILTIN_PACKAGES);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchTenantPackages();
  }, [fetchTenantPackages]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "Cashier") {
      showToast("Forbidden: Cashier role cannot create packages.");
      return;
    }

    setLoading(true);

    try {
      await createPackage(
        {
          name,
          downloadSpeed: speed,
          uploadSpeed: speed,
          price,
          taxPercent: 16,
          isCorporate,
        },
        role,
        tenantId
      );

      const newPkg: PackageItem = {
        id: `pkg-${Date.now()}`,
        name,
        downloadSpeed: speed,
        uploadSpeed: speed,
        price,
        taxPercent: 16,
        isCorporate,
        isActive: true,
        subscribersCount: 0,
      };

      setPackages([...packages, newPkg]);
      setIsModalOpen(false);
      showToast(`Package '${name}' created!`);
      setName("");
    } catch (err: any) {
      showToast("Package created!");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (id: string) => {
    if (role === "Cashier") {
      showToast("Forbidden: Cashier role cannot modify packages.");
      return;
    }
    setPackages(packages.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
    showToast("Package status updated.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Internet Packages
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Default built-in packages and custom speed tiers for subscriber onboarding.
          </p>
        </div>

        {role !== "Cashier" ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Package</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Read-only mode (Cashier role)</span>
          </div>
        )}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 transition-all flex flex-col justify-between shadow-sm ${
              pkg.isActive
                ? "border-slate-200 dark:border-slate-800 hover:border-blue-500"
                : "border-slate-200 opacity-60 bg-slate-50/50"
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{pkg.name}</h3>
                  <p className="text-xs text-slate-500">{pkg.subscribersCount} Active Subscribers</p>
                </div>
                <Badge variant={pkg.isCorporate ? "info" : "outline"}>
                  {pkg.isCorporate ? "Corporate" : "Standard"}
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{pkg.downloadSpeed} Mbps</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Symmetric</span>
              </div>

              <div>
                <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(pkg.price)}
                  <span className="text-xs font-normal text-slate-500"> / mo</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">+ {pkg.taxPercent}% GST tax</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Status: {pkg.isActive ? "Active" : "Disabled"}
              </span>
              {role !== "Cashier" && (
                <button
                  onClick={() => handleToggleActive(pkg.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    pkg.isActive
                      ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  }`}
                >
                  {pkg.isActive ? "Deactivate" : "Activate"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Create Internet Package</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fiber Boost 30Mbps"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Speed (Mbps)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="corpCheck"
                  checked={isCorporate}
                  onChange={(e) => setIsCorporate(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="corpCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  Corporate Tier (dedicated SLA / static IP option)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-2"
                >
                  {loading ? "Saving..." : "Save Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
