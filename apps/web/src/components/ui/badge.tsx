import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "active" | "paid" | "pending" | "due" | "overdue" | "suspended" | "closed" | "info" | "outline";
}

export function Badge({ className, variant = "info", children, ...props }: BadgeProps) {
  const variantStyles = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    due: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    overdue: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
    suspended: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
    closed: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/20",
    info: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    outline: "border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variantStyles[variant] || variantStyles.info,
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children}
    </span>
  );
}
