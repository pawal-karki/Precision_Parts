import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AdminAuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
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
    return () => {
      cancelled = true;
    };
  }, []);

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
        <Icon name="sync" className="text-3xl animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <motion.section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" variants={fadeInUp} initial="initial" animate="animate">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary mb-2">
            <Icon name="verified_user" className="text-sm" />
            Operational · Secure encrypted layer
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-on-surface dark:text-neutral-100 tracking-tight">
            Audit log
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-400 mt-1 max-w-xl">
            Immutable-style ledger of security, inventory, and billing events (demo dataset from API).
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
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
          <Input
            className="pl-10"
            placeholder="Search actor, action, entity, reference…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="audit-action" className="text-sm text-on-surface-variant whitespace-nowrap">
            Action
          </label>
          <select
            id="audit-action"
            className="h-10 rounded-lg border border-surface-container-highest dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-on-surface dark:text-neutral-200 min-w-[200px]"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-on-surface-variant md:ml-auto">
          Showing <span className="font-bold text-on-surface dark:text-neutral-200">{filtered.length}</span> of{" "}
          {rows.length} entries
        </p>
      </motion.div>

      <motion.div
        className="mt-6 bg-white dark:bg-[#1C1C1C] rounded-xl border border-surface-container-low dark:border-neutral-800 overflow-hidden"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <Table>
          <TableHeader>
            <TableRow className="text-[10px] font-bold uppercase text-on-surface-variant border-b border-surface-container dark:border-neutral-800">
              <TableHead>Time (UTC)</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow
                key={r.id}
                className="hover:bg-background dark:hover:bg-neutral-800/30 border-b border-surface-container-low/80 dark:border-neutral-800/80"
              >
                <TableCell className="text-xs font-mono text-on-surface-variant whitespace-nowrap">{r.timestamp}</TableCell>
                <TableCell className="text-sm font-medium">{r.actor}</TableCell>
                <TableCell>
                  <Badge variant="primary">{r.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">{r.entity}</TableCell>
                <TableCell className="text-sm max-w-md">{r.details}</TableCell>
                <TableCell className="text-xs font-mono text-on-surface-variant">{r.reference}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={r.badge === "error" ? "error" : r.badge === "warning" ? "warning" : "neutral"}>
                    {r.severity}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant text-sm">No entries match your filters.</div>
        )}
      </motion.div>
    </PageTransition>
  );
}
       