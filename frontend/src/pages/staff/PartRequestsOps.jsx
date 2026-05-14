import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { PageTransition, motion } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { formatNpt } from "@/lib/utils";

const STATUSES = ["Pending", "Sourcing", "Available", "Cancelled"];

function statusVariant(s) {
  const x = String(s || "").toLowerCase();
  if (x === "available") return "success";
  if (x === "sourcing") return "info";
  if (x === "cancelled") return "neutral";
  return "warning";
}

export default function PartRequestsOps() {
  const location = useLocation();
  const toast = useToast();
  const base = location.pathname.startsWith("/admin") ? "/admin" : "/staff";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getStaffPartRequests();
      setRows(Array.isArray(list) ? list : []);
    } catch {
      toast("Could not load part requests", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onStatusChange(id, status) {
    try {
      await api.updateStaffPartRequestStatus(id, { status });
      toast("Status updated", "success");
      await load();
    } catch (e) {
      toast(e?.message || "Update failed", "error");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline">
                Part requests
              </h1>
              <Badge variant="neutral" className="text-[10px] uppercase tracking-widest">
                {base === "/admin" ? "Admin" : "Staff"}
              </Badge>
            </div>
            <p className="text-on-surface-variant dark:text-neutral-500 mt-1 max-w-2xl">
              Customer custom part sourcing from the portal. Update status as you source, receive stock, or close the line.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <Icon name="refresh" className="text-sm" />
              Refresh
            </Button>
            {base === "/admin" ? (
              <>
                <Button variant="secondary" asChild>
                  <Link to="/admin/inventory">
                    <Icon name="inventory_2" className="text-sm" />
                    Inventory
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/admin/purchase-invoices">
                    <Icon name="local_shipping" className="text-sm" />
                    Purchases
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant="secondary" asChild>
                <Link to="/staff/search">
                  <Icon name="search" className="text-sm" />
                  Part search
                </Link>
              </Button>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-surface-container dark:border-neutral-800 overflow-hidden shadow-sm"
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <Icon name="sync" className="text-3xl animate-spin text-secondary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-on-surface-variant py-14 text-sm">No part requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low/50 dark:bg-neutral-900/50">
                  <TableHead className="px-4">Submitted (NPT)</TableHead>
                  <TableHead className="px-4">Customer</TableHead>
                  <TableHead className="px-4">Part</TableHead>
                  <TableHead className="px-4">Vehicle</TableHead>
                  <TableHead className="px-4">Urgency</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4 text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-b border-surface-container dark:border-neutral-800">
                    <TableCell className="px-4 text-xs whitespace-nowrap text-on-surface-variant">
                      {formatNpt(r.createdAtUtc)}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="font-semibold text-on-surface dark:text-neutral-100">{r.customerName}</div>
                      <div className="text-[11px] text-on-surface-variant truncate max-w-[200px]">{r.customerEmail}</div>
                      <Link
                        to={`${base}/customers/${r.customerPublicId}`}
                        className="text-[11px] font-bold text-secondary hover:underline"
                      >
                        Open profile
                      </Link>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="font-bold text-sm">{r.partName}</div>
                      {r.partNumber && (
                        <div className="text-xs text-on-surface-variant font-mono">{r.partNumber}</div>
                      )}
                      {r.description && (
                        <div className="text-xs text-on-surface-variant mt-1 line-clamp-2" title={r.description}>
                          {r.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-on-surface-variant">{r.vehicleModel || "—"}</TableCell>
                    <TableCell className="px-4">
                      <Badge variant={String(r.urgency).toLowerCase() === "critical" ? "error" : "neutral"} className="text-[10px]">
                        {r.urgency || "Normal"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <select
                        className="text-xs font-bold rounded-lg border border-outline-variant dark:border-neutral-600 bg-surface-container-lowest dark:bg-neutral-900 px-2 py-2 max-w-[140px]"
                        value={r.status}
                        onChange={(e) => void onStatusChange(r.id, e.target.value)}
                        aria-label={`Status for ${r.partName}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
