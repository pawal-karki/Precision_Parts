import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO date string (or Date) to Nepali Standard Time (NPT, UTC+05:45).
 * @param {string|Date} value
 * @param {{ date?: boolean, time?: boolean, seconds?: boolean }} opts
 */
export function formatNpt(value, { date = true, time = true, seconds = false } = {}) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";

  /** @type {Intl.DateTimeFormatOptions} */
  const opts = {
    timeZone: "Asia/Kathmandu",
    ...(date && { year: "numeric", month: "short", day: "2-digit" }),
    ...(time && { hour: "2-digit", minute: "2-digit", ...(seconds && { second: "2-digit" }) }),
    hour12: false,
  };

  return new Intl.DateTimeFormat("en-GB", opts).format(d) + " NPT";
}

/** Format a Date string (ISO or DateOnly) to a human-readable date. */
export function formatDate(value) {
  if (!value) return "—";
  // If it's a simple date (YYYY-MM-DD), treat as UTC midnight
  const dateStr = (typeof value === "string" && value.length === 10 && value.includes("-")) 
    ? `${value}T00:00:00Z` 
    : value;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(d);
}
