import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  trendType = "neutral",
  className,
}) {
  const trendColors = {
    up: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-500",
    down: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-500",
    neutral:
      "text-on-surface-variant bg-surface-container-low dark:bg-neutral-800 dark:text-neutral-400",
    error:
      "text-error bg-error-container/20",
  };

  return (
    <div
      className={cn(
        "bg-surface-container-lowest dark:bg-[#1C1C1C] p-6 rounded-xl border border-transparent dark:border-neutral-800/50 flex flex-col justify-between group hover:bg-white dark:hover:bg-neutral-900 transition-all duration-300",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="p-2 bg-surface-container-low dark:bg-neutral-900 rounded-lg text-secondary dark:text-slate-400 group-hover:dark:text-slate-200 transition-colors">
          <Icon name={icon} />
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded",
              trendColors[trendType]
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-on-surface-variant dark:text-neutral-500 text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        <h3 className="text-2xl font-extrabold mt-1 text-on-surface dark:text-neutral-100 tracking-tight">
          {value}
        </h3>
      </div>
    </div>
  );
}
