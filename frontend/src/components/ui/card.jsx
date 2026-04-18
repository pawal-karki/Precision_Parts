import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-container-lowest p-6 transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-lg font-bold font-headline tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm text-on-surface-variant", className)} {...props} />
  );
}

function CardContent({ className, ...props }) {
  return <div className={cn("", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return (
    <div className={cn("flex items-center pt-4", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
