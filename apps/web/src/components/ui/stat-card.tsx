import * as React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: StatCardProps) {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-110">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </div>
        {change && (
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
            <span
              className={
                changeType === "positive"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : changeType === "negative"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400"
              }
            >
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
