import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary-container text-on-secondary-container",
        success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500",
        warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500",
        error: "bg-error-container/20 text-error",
        info: "bg-secondary-fixed text-on-secondary-fixed",
        neutral: "bg-surface-container-low text-on-surface-variant",
        primary: "bg-primary-container text-on-primary-container",
        tertiary: "bg-tertiary-container text-on-tertiary-container",
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
