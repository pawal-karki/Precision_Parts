import { cn } from "@/lib/utils";

export function Icon({ name, className, filled, ...props }) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
          : undefined
      }
      {...props}
    >
      {name}
    </span>
  );
}
