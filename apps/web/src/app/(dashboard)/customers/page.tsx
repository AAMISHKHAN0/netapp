"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { RoleContext } from "../layout";
import { maskCNIC, formatCurrency } from "@smartisp/utils";
import { getCustomers } from "@/lib/actions";
import {
  Search,
  Plus,
  Filter,
  UserCheck,
  UserX,
  X,
  CheckCircle,
  Phone,
  Wifi,
  MapPin,
  Edit2,
  Settings,
  AlertCircle,
  PackageCheck,
  ChevronDown,
  Clock,
  UserMinus,
} from "lucide-react";

import { CustomerItem, CoverageArea, DEFAULT_SUBSCRIBERS, INITIAL_AREAS } from "@/lib/subscribers";

export default function CustomersPage() {
  const { role, tenantId } = React.useContext(RoleContext);
  const [activeTab, setActiveTab] = React.useState<"subscribers" | "areas">("subscribers");
  const [customers, setCustomers] = React.useState<CustomerItem[]>(DEFAULT_SUBSCRIBERS);
  const [areas, setAreas] = React.useState<CoverageArea[]>(INITIAL_AREAS);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [selectedCust, setSelectedCust] = React.useState<CustomerItem | null>(null);

  // Modals & toast
  const [isNewCustModalOpen, setIsNewCustModalOpen] = React.useState(false);
  const [isEditCustModalOpen, setIsEditCustModalOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<CustomerItem | null>(null);

  const [isAreaModalOpen, setIsAreaModalOpen] = React.useState(false);
  const [editingArea, setEditingArea] = React.useState<CoverageArea | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // New Customer Form state
  const [newName, setNewName] = React.useState("");
  const [newCnic, setNewCnic] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newArea, setNewArea] = React.useState("Johar Town");
  const [newPackage, setNewPackage] = React.useState("Home Standard 20Mbps");
  const [newFee, setNewFee] = React.useState(2500);

  // Edit Customer Form state
  const [editName, setEditName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [editCnic, setEditCnic] = React.useState("");
  const [editArea, setEditArea] = React.useState("Johar Town");
  const [editPackage, setEditPackage] = React.useState("Home Standard 20Mbps");
  const [editFee, setEditFee] = React.useState(2500);
  const [editStatus, setEditStatus] = React.useState<"ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED">("ACTIVE");

  // Area Form state
  const [areaNameInput, setAreaNameInput] = React.useState("");
  const [areaCityInput, setAreaCityInput] = React.useState("Lahore");
  const [areaNodeInput, setAreaNodeInput] = React.useState("POP-MAIN-01");

  const fetchTenantCustomers = React.useCallback(async () => {
    try {
      const storageKey = `smartisp_tenant_customers_${tenantId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCustomers(JSON.parse(saved));
        return;
      }

      const res = await getCustomers(search, statusFilter, tenantId);
      if (res && res.length > 0) {
        const mapped = res.map((c: any) => ({
          id: c.id,
          name: c.name,
          cnic: c.cnic,
          phone: c.phone,
          whatsapp: c.whatsapp,
          address: c.address,
          area: c.area || "Johar Town",
          packageName: c.package?.name || "Standard",
          monthlyFee: Number(c.monthlyFee),
          status: c.status,
          pppoeUsername: c.pppoeUsername,
          onuMac: c.onuMac,
          previousBalance: Number(c.previousBalance || 0),
        }));
        setCustomers(mapped);
        localStorage.setItem(storageKey, JSON.stringify(mapped));
      } else {
        setCustomers(DEFAULT_SUBSCRIBERS);
        localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SUBSCRIBERS));
      }
    } catch (err) {
      setCustomers(DEFAULT_SUBSCRIBERS);
    }
  }, [search, statusFilter, tenantId]);

  React.useEffect(() => {
    fetchTenantCustomers();
  }, [fetchTenantCustomers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.cnic.includes(search) ||
      c.area.toLowerCase().includes(search.toLowerCase()) ||
      (c.pppoeUsername && c.pppoeUsername.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newCust: CustomerItem = {
        id: `cust-${Date.now()}`,
        name: newName,
        cnic: newCnic,
        phone: newPhone,
        whatsapp: newPhone,
        address: `${newArea}, Lahore`,
        area: newArea,
        packageName: newPackage,
        monthlyFee: newFee,
        status: "ACTIVE",
        pppoeUsername: newName.toLowerCase().replace(/\s+/g, "_"),
        previousBalance: newFee,
      };

      const updated = [newCust, ...customers];
      setCustomers(updated);
      localStorage.setItem(`smartisp_tenant_customers_${tenantId}`, JSON.stringify(updated));

      setIsNewCustModalOpen(false);
      showToast(`Subscriber '${newName}' registered!`);
      setNewName("");
      setNewCnic("");
      setNewPhone("");
    } catch (err: any) {
      showToast("Subscriber saved!");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditCustomer = (cust: CustomerItem) => {
    setEditingCustomer(cust);
    setEditName(cust.name);
    setEditPhone(cust.phone);
    setEditCnic(cust.cnic);
    setEditArea(cust.area);
    setEditPackage(cust.packageName);
    setEditFee(cust.monthlyFee);
    setEditStatus(cust.status);
    setIsEditCustModalOpen(true);
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const updated = customers.map((c) =>
      c.id === editingCustomer.id
        ? {
            ...c,
            name: editName,
            phone: editPhone,
            cnic: editCnic,
            area: editArea,
            packageName: editPackage,
            monthlyFee: editFee,
            status: editStatus,
          }
        : c
    );

    setCustomers(updated);
    localStorage.setItem(`smartisp_tenant_customers_${tenantId}`, JSON.stringify(updated));

    if (selectedCust?.id === editingCustomer.id) {
      setSelectedCust({
        ...selectedCust,
        name: editName,
        phone: editPhone,
        cnic: editCnic,
        area: editArea,
        packageName: editPackage,
        monthlyFee: editFee,
        status: editStatus,
      });
    }

    setIsEditCustModalOpen(false);
    showToast(`Subscriber ${editName} updated to status: ${editStatus}!`);
  };

  // --- Perform Status Action Toggle (ACTIVE | SUSPENDED | PENDING | CLOSED) ---
  const handlePerformStatusChange = (cust: CustomerItem, targetStatus: "ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED") => {
    const updated = customers.map((c) => (c.id === cust.id ? { ...c, status: targetStatus } : c));
    setCustomers(updated);
    localStorage.setItem(`smartisp_tenant_customers_${tenantId}`, JSON.stringify(updated));

    if (selectedCust?.id === cust.id) {
      setSelectedCust({ ...selectedCust, status: targetStatus });
    }

    showToast(`Subscriber ${cust.name} status updated to ${targetStatus}!`);
  };

  // --- Area Management Handlers ---
  const handleOpenNewArea = () => {
    setEditingArea(null);
    setAreaNameInput("");
    setAreaCityInput("Lahore");
    setAreaNodeInput(`POP-${Date.now().toString().slice(-4)}`);
    setIsAreaModalOpen(true);
  };

  const handleOpenEditArea = (area: CoverageArea) => {
    setEditingArea(area);
    setAreaNameInput(area.name);
    setAreaCityInput(area.city);
    setAreaNodeInput(area.nodeName);
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaNameInput) return;

    if (editingArea) {
      setAreas(
        areas.map((a) =>
          a.id === editingArea.id
            ? { ...a, name: areaNameInput, city: areaCityInput, nodeName: areaNodeInput }
            : a
        )
      );
      showToast(`Coverage Area '${areaNameInput}' updated!`);
    } else {
      const newAreaObj: CoverageArea = {
        id: `area-${Date.now()}`,
        name: areaNameInput,
        city: areaCityInput,
        nodeName: areaNodeInput,
        status: "ACTIVE",
      };
      setAreas([...areas, newAreaObj]);
      showToast(`New Coverage Area '${areaNameInput}' added!`);
    }

    setIsAreaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Subscriber Directory & Coverage Areas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perform actions (Set Active, Suspended, Pending, Closed) and manage coverage areas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "subscribers"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            Subscribers List ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab("areas")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "areas"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Manage Coverage Areas ({areas.length})</span>
          </button>

          {role !== "Cashier" && (
            <button
              onClick={() => setIsNewCustModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: SUBSCRIBERS LIST --- */}
      {activeTab === "subscribers" && (
        <div className="space-y-6">
          {/* Search & Status Filters */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, Phone, CNIC, Area, or PPPoE Username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              {(["ALL", "ACTIVE", "SUSPENDED", "PENDING", "CLOSED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={selectedCust ? "lg:col-span-2" : "lg:col-span-3"}>
              <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="p-4">Customer</th>
                        <th className="p-4">Package</th>
                        <th className="p-4">Coverage Area</th>
                        <th className="p-4">Current Status</th>
                        <th className="p-4">Perform Status Action</th>
                        <th className="p-4 text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredCustomers.map((cust) => (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCust(cust)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            selectedCust?.id === cust.id ? "bg-blue-50/40 dark:bg-blue-500/10" : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{cust.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{maskCNIC(cust.cnic)} · {cust.phone}</div>
                          </td>
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                            {cust.packageName}
                          </td>
                          <td className="p-4 font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {cust.area}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                cust.status === "ACTIVE"
                                  ? "active"
                                  : cust.status === "SUSPENDED"
                                  ? "suspended"
                                  : cust.status === "PENDING"
                                  ? "pending"
                                  : "closed"
                              }
                            >
                              {cust.status}
                            </Badge>
                          </td>
                          {/* STATUS ACTION SELECTOR DROPDOWN (ACTIVE, SUSPENDED, PENDING, CLOSED) */}
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={cust.status}
                              onChange={(e) =>
                                handlePerformStatusChange(
                                  cust,
                                  e.target.value as "ACTIVE" | "SUSPENDED" | "PENDING" | "CLOSED"
                                )
                              }
                              className={`p-2 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer transition-all ${
                                cust.status === "ACTIVE"
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                  : cust.status === "SUSPENDED"
                                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400"
                                  : cust.status === "PENDING"
                                  ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                                  : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <option value="ACTIVE">🟢 Set ACTIVE</option>
                              <option value="SUSPENDED">🔴 Set SUSPENDED</option>
                              <option value="PENDING">🟡 Set PENDING</option>
                              <option value="CLOSED">⚪ Set CLOSED</option>
                            </select>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditCustomer(cust)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors font-semibold flex items-center gap-1 ml-auto"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Selected Customer Detail Drawer */}
            {selectedCust && (
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-lg animate-in fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">{selectedCust.name}</h2>
                    <p className="text-xs text-slate-500 font-mono">{selectedCust.phone}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCust(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs border-t border-b border-slate-100 dark:border-slate-800 py-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Status:</span>
                    <Badge variant={selectedCust.status === "ACTIVE" ? "active" : selectedCust.status === "SUSPENDED" ? "suspended" : "closed"}>
                      {selectedCust.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Package:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedCust.packageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Fee:</span>
                    <span className="font-bold text-blue-600 tabular-nums">{formatCurrency(selectedCust.monthlyFee)}</span>
                  </div>
                </div>

                {/* Direct Action Buttons for All 4 Statuses */}
                <div className="space-y-2 pt-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Perform Status Action:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePerformStatusChange(selectedCust, "ACTIVE")}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        selectedCust.status === "ACTIVE"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Set ACTIVE
                    </button>
                    <button
                      onClick={() => handlePerformStatusChange(selectedCust, "SUSPENDED")}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        selectedCust.status === "SUSPENDED"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" /> Set SUSPENDED
                    </button>
                    <button
                      onClick={() => handlePerformStatusChange(selectedCust, "PENDING")}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        selectedCust.status === "PENDING"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "border border-amber-300 text-amber-700 hover:bg-amber-50"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Set PENDING
                    </button>
                    <button
                      onClick={() => handlePerformStatusChange(selectedCust, "CLOSED")}
                      className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        selectedCust.status === "CLOSED"
                          ? "bg-slate-800 text-white shadow-xs"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Set CLOSED
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: COVERAGE AREAS MANAGEMENT --- */}
      {activeTab === "areas" && (
        <div className="space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">ISP Coverage Areas & Sectors</h2>
              <p className="text-xs text-slate-500">Configure geographical sectors, local POP nodes, and area assignments.</p>
            </div>
            <button
              onClick={handleOpenNewArea}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Area</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {areas.map((area) => {
              const subscriberCount = customers.filter((c) => c.area === area.name).length;
              return (
                <div
                  key={area.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:border-blue-500 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{area.name}</h3>
                          <p className="text-xs text-slate-500">{area.city}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenEditArea(area)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Node / POP:</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{area.nodeName}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Active Connections:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{subscriberCount} Subscribers</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- EDIT CUSTOMER MODAL --- */}
      {isEditCustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Edit Subscriber: {editName}
              </h2>
              <button onClick={() => setIsEditCustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CNIC</label>
                  <input
                    type="text"
                    required
                    value={editCnic}
                    onChange={(e) => setEditCnic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-3">
                <label className="block font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-blue-600" />
                  Internet Package Tier
                </label>

                <select
                  value={editPackage}
                  onChange={(e) => {
                    setEditPackage(e.target.value);
                    if (e.target.value.includes("10Mbps")) setEditFee(1500);
                    else if (e.target.value.includes("20Mbps")) setEditFee(2500);
                    else if (e.target.value.includes("50Mbps")) setEditFee(4500);
                    else if (e.target.value.includes("100Mbps")) setEditFee(12000);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="Home Basic 10Mbps">Home Basic 10Mbps — Rs. 1,500 / mo</option>
                  <option value="Home Standard 20Mbps">Home Standard 20Mbps — Rs. 2,500 / mo</option>
                  <option value="Ultra Speed 50Mbps">Ultra Speed 50Mbps — Rs. 4,500 / mo</option>
                  <option value="Corporate Fiber 100Mbps">Corporate Fiber 100Mbps — Rs. 12,000 / mo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Coverage Area</label>
                  <select
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Connection Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="ACTIVE">🟢 ACTIVE</option>
                    <option value="SUSPENDED">🔴 SUSPENDED</option>
                    <option value="PENDING">🟡 PENDING</option>
                    <option value="CLOSED">⚪ CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditCustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Save Profile & Status Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD AREA MODAL --- */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editingArea ? `Update Area '${editingArea.name}'` : "Add New Coverage Area"}
              </h2>
              <button onClick={() => setIsAreaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Area / Sector Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iqbal Town / Sector B"
                  value={areaNameInput}
                  onChange={(e) => setAreaNameInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={areaCityInput}
                    onChange={(e) => setAreaCityInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Local POP Node</label>
                  <input
                    type="text"
                    required
                    value={areaNodeInput}
                    onChange={(e) => setAreaNodeInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {editingArea ? "Update Area Details" : "Save New Coverage Area"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOMER MODAL --- */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">Add New ISP Subscriber</h2>
              <button onClick={() => setIsNewCustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hassan Ahmed"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">CNIC Number</label>
                  <input
                    type="text"
                    required
                    placeholder="35202-1234567-1"
                    value={newCnic}
                    onChange={(e) => setNewCnic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="03001234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Select Coverage Area</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} ({a.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Internet Package</label>
                  <select
                    value={newPackage}
                    onChange={(e) => {
                      setNewPackage(e.target.value);
                      if (e.target.value.includes("10Mbps")) setNewFee(1500);
                      else if (e.target.value.includes("20Mbps")) setNewFee(2500);
                      else if (e.target.value.includes("50Mbps")) setNewFee(4500);
                      else if (e.target.value.includes("100Mbps")) setNewFee(12000);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Home Basic 10Mbps">Basic 10Mbps (Rs. 1,500)</option>
                    <option value="Home Standard 20Mbps">Home Standard 20Mbps (Rs. 2,500)</option>
                    <option value="Ultra Speed 50Mbps">Ultra Speed 50Mbps (Rs. 4,500)</option>
                    <option value="Corporate Fiber 100Mbps">Corporate Fiber 100Mbps (Rs. 12,000)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center gap-2"
                >
                  {loading ? "Saving..." : "Save Customer Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
