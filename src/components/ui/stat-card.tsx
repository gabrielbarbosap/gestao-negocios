import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: Icon;
  trend?: { value: number; label: string };
  className?: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className, iconColor }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-100 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs",
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2", iconColor ?? "bg-sky-50")}>
            <Icon className={cn("h-5 w-5", iconColor ? "text-white" : "text-sky-600")} />
          </div>
        )}
      </div>
    </div>
  );
}
