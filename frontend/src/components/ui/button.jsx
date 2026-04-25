import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-on-primary hover:bg-primary-dim",
        secondary: "bg-secondary text-on-secondary hover:bg-secondary-dim",
        destructive: "bg-error text-on-error hover:bg-error-dim",
        outline:
          "border border-outline-variant dark:border-neutral-800 bg-transparent text-on-surface dark:text-neutral-300 hover:bg-surface-container-low dark:hover:bg-neutral-800",
        ghost: "text-on-surface dark:text-neutral-400 hover:bg-surface-container-low dark:hover:bg-neutral-800",
        link: "text-secondary dark:text-slate-400 underline-offset-4 hover:underline",
        surface:
          "bg-surface-container-low dark:bg-neutral-900 text-on-surface dark:text-neutral-300 hover:bg-surface-container-high dark:hover:bg-neutral-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
