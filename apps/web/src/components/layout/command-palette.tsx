"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, CreditCard, UserPlus, Package, FileText, MessageSquare } from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { label: "Record Payment (POS)", href: "/payments", icon: CreditCard },
    { label: "Add New Customer", href: "/customers?action=new", icon: UserPlus },
    { label: "Manage Packages", href: "/packages", icon: Package },
    { label: "View Monthly Invoices", href: "/billing", icon: FileText },
    { label: "Trigger WhatsApp Reminders", href: "/reminders", icon: MessageSquare },
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#26272B] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-[#26272B]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3.5 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded">
            ESC
          </kbd>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto">
          {actions.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500">No matching commands found.</p>
          ) : (
            actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.href}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(act.href);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Icon className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600" />
                  <span>{act.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
