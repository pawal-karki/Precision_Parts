import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-12 w-full appearance-none rounded-xl border border-outline-variant/60 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 px-4 py-3 pr-10 text-base text-on-surface dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 dark:focus:ring-secondary/10 focus:border-secondary dark:focus:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm shadow-black/5",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/70 dark:text-neutral-500">
        <Icon name="expand_more" className="text-xl" />
      </div>
      <style>{`
        select option {
          background-color: #1a1a1a;
          color: #e5e5e5;
          padding: 10px;
        }
        @media (prefers-color-scheme: light) {
          select option {
            background-color: white;
            color: #1a1a1a;
          }
        }
      `}</style>
    </div>
  );
});
Select.displayName = "Select";

export { Select };
