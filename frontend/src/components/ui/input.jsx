import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-outline-variant/60 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 px-4 py-3 text-base text-on-surface dark:text-neutral-200 placeholder:text-on-surface-variant/70 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-secondary/20 dark:focus:ring-secondary/10 focus:border-secondary dark:focus:border-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm shadow-black/5",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
