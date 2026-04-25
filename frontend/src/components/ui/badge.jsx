import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary-container dark:bg-neutral-800 text-on-secondary-container dark:text-neutral-300",
        success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500",
        warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500",
        error: "bg-error-container/20 text-error dark:text-rose-400 dark:bg-rose-500/10",
        info: "bg-secondary-fixed dark:bg-slate-500/10 text-on-secondary-fixed dark:text-slate-400",
        neutral: "bg-surface-container-low dark:bg-neutral-800 text-on-surface-variant dark:text-neutral-500",
        primary: "bg-primary-container dark:bg-neutral-800 text-on-primary-container dark:text-neutral-300",
        tertiary: "bg-tertiary-container dark:bg-neutral-800 text-on-tertiary-container dark:text-neutral-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
