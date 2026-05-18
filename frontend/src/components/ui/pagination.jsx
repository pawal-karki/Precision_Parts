import { Icon } from "./icon";

export const DEFAULT_PAGE_SIZE = 10;

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1 <= 5 ? i + 1 : i === 5 ? "…" : totalPages;
    if (page >= totalPages - 3)
      return i === 0 ? 1 : i === 1 ? "…" : totalPages - (6 - i);
    return i === 0
      ? 1
      : i === 1
        ? "…"
        : i === 5
          ? "…"
          : i === 6
            ? totalPages
            : page - 2 + (i - 2);
  });

  const clamp = (p) => Math.max(1, Math.min(totalPages, p));

  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        onClick={() => onPageChange(clamp(page - 1))}
        disabled={page === 1}
      >
        <Icon name="chevron_left" className="text-sm" /> Previous
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-3 py-1.5 text-slate-400 text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                : "text-slate-700 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        onClick={() => onPageChange(clamp(page + 1))}
        disabled={page === totalPages}
      >
        Next <Icon name="chevron_right" className="text-sm" />
      </button>
    </div>
  );
}
