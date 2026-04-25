import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { PageTransition, motion, fadeInUp } from "@/components/ui/motion";
import { useToast } from "@/components/ui/toast";
import { formatNpt } from "@/lib/utils";

const PAGE_SIZE = 20;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1 <= 5 ? i + 1 : i === 5 ? "…" : totalPages;
    if (page >= totalPages - 3) return i === 0 ? 1 : i === 1 ? "…" : totalPages - (6 - i);
    return i === 0 ? 1 : i === 1 ? "…" : i === 5 ? "…" : i === 6 ? totalPages : page - 2 + (i - 2);
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      <button
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <Icon name="chevron_left" className="text-sm" /> Previous
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-3 py-1.5 text-slate-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                : "text-slate-700 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next <Icon name="chevron_right" className="text-sm" />
      </button>
    </div>
  );
}

export default function AdminAuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getAuditLog();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          toast(e.message || "Failed to load audit log", "error");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [q, actionFilter]);

  const actionTypes = useMemo(() => {
    const s = new Set(rows.map((r) => r.action).filter(Boolean));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (!qq) return true;
      const hay = `${r.timestamp} ${r.actor} ${r.action} ${r.entity} ${r.details} ${r.reference}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const headers = ["id", "timestamp", "actor", "action", "entity", "details", "reference", "severity"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")].concat(
      filtered.map((r) => headers.map((h) => esc(r[h])).join(",")),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `precision-parts-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Audit export downloaded", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant">
        <Icon name="progress_activity" className="text-3xl animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <PageTransition className="space-y-10">
      <motion.section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" variants={fadeInUp} initial="initial" animate="animate">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary dark:text-secondary-fixed mb-2">
            <Icon name="verified_user" className="text-sm" />
            Operational · Secure encrypted layer · Timestamps in NPT (UTC+05:45)
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-slate-900 dark:text-white tracking-tight">
            Audit Log
          </h1>
          <p className="text-slate-500 dark:text-neutral-400 mt-1 max-w-xl">
            Immutable-style ledger of security, inventory, and billing events. All times shown in Nepal Standard Time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin">
              <Icon name="arrow_back" className="text-sm" />
              Dashboard
            </Link>
          </Button>
          <Button variant="secondary" onClick={exportCsv}>
            <Icon name="download" className="text-sm" />
            Export CSV
          </Button>
        </div>
      </motion.section>

      <motion.div
        className="mt-8 flex flex-col gap-4 md:flex-row md:items-center"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.05 }}
      >
        <div className="relative flex-1 max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <Input
            className="pl-10"
            placeholder="Search actor, action, entity, reference…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="audit-action" className="text-sm text-slate-500 whitespace-nowrap">
            Action
          </label>
          <Select
            id="audit-action"
            className="min-w-[200px]"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </div>
        <p className="text-sm text-slate-500 md:ml-auto">
          Showing <span className="font-bold text-slate-800 dark:text-neutral-200">{paginated.length}</span> of{" "}
          {filtered.length} entries (page {page}/{totalPages})
        </p>
      </motion.div>

      <motion.div
        className="overflow-x-auto bg-white dark:bg-[#1C1C1C] rounded-xl border border-surface-container-low dark:border-neutral-800/50 shadow-sm"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <tr className="bg-surface-container-low/50 dark:bg-neutral-900/50 border-b border-surface-container dark:border-neutral-800">
                <TableHead className="px-6">Time (NPT)</TableHead>
                <TableHead className="px-6">Actor</TableHead>
                <TableHead className="px-6">Action</TableHead>
                <TableHead className="px-6">Entity</TableHead>
                <TableHead className="px-6">Details</TableHead>
                <TableHead className="px-6">Reference</TableHead>
                <TableHead className="px-6 text-right">Severity</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginated.map((r) => (
                <TableRow key={r.id} className="border-b border-surface-container-low/50 dark:border-neutral-800/30 hover:bg-surface-container-low/30 dark:hover:bg-neutral-800/20 transition-colors">
                  <TableCell className="px-6 font-mono text-xs text-on-surface-variant dark:text-neutral-500 whitespace-nowrap">
                    {formatNpt(r.timestamp)}
                  </TableCell>
                  <TableCell className="px-6 font-semibold text-on-surface dark:text-neutral-200">{r.actor}</TableCell>
                  <TableCell className="px-6">
                    <Badge variant="primary">{r.action}</Badge>
                  </TableCell>
                  <TableCell className="px-6 text-on-surface-variant dark:text-neutral-400">{r.entity}</TableCell>
                  <TableCell className="px-6 max-w-sm text-on-surface-variant dark:text-neutral-400 text-xs leading-relaxed">{r.details}</TableCell>
                  <TableCell className="px-6 font-mono text-xs text-on-surface-variant dark:text-neutral-500">{r.reference}</TableCell>
                  <TableCell className="px-6 text-right">
                    <Badge variant={r.badge === "error" || r.severity?.toLowerCase() === "error" ? "error" : r.badge === "warning" ? "warning" : "neutral"}>
                      {r.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant dark:text-neutral-500 text-sm">
            <Icon name="search_off" className="text-4xl mb-2 opacity-20" />
            <p>No entries match your filters.</p>
          </div>
        )}
      </motion.div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageTransition>
  );
}