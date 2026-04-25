import { cn } from "@/lib/utils";

function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-auto rounded-xl border border-slate-200 dark:border-neutral-700">
      <table className={cn("w-full caption-bottom text-left text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead className={cn("bg-slate-50 dark:bg-neutral-900", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      className={cn("divide-y divide-slate-200 dark:divide-neutral-800", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "group hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap border-b border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return <td className={cn("px-4 py-3.5 text-sm text-slate-800 dark:text-slate-200", className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
