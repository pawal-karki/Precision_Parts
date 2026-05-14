import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp, AnimatePresence } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "success";
  if (s === "unpaid" || s === "partial") return "warning";
  if (s === "overdue") return "error";
  return "neutral";
}

export default function StaffPosHistory() {
  const location = useLocation();
  const toast = useToast();
  const base = location.pathname.startsWith("/admin") ? "/admin" : "/staff";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({ staffNotes: "", dueDateIso: "", markCollected: false });
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getStaffPosHistory(200);
      setRows(Array.isArray(list) ? list : []);
    } catch {
      toast("Could not load POS history", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id) {
    try {
      const d = await api.getStaffPosSaleDetail(id);
      setDetail(d);
    } catch {
      toast("Could not load sale details", "error");
    }
  }

  async function openEdit(row) {
    setEditRow(row);
    setEditLoading(true);
    try {
      const d = await api.getStaffPosSaleDetail(row.id);
      const due = d.dueDate ? String(d.dueDate).slice(0, 10) : "";
      setEditForm({
        staffNotes: d.staffNotes ?? "",
        dueDateIso: due,
        markCollected: false,
      });
    } catch {
      setEditForm({ staffNotes: "", dueDateIso: "", markCollected: false });
    } finally {
      setEditLoading(false);
    }
  }

  async function saveEdit() {
    if (!editRow) return;
    setSaving(true);
    try {
      const payload = {
        staffNotes: editForm.staffNotes,
        dueDateIso: editForm.dueDateIso || null,
        markCollectedAtCounter: editForm.markCollected,
      };
      await api.updateStaffPosSale(editRow.id, payload);
      toast("Sale updated", "success");
      const editedId = editRow.id;
      setEditRow(null);
      await load();
      if (detail?.id === editedId) await openDetail(editedId);
    } catch (e) {
      toast(e?.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-16 max-w-6xl mx-auto">
        <motion.header
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-headline text-3xl font-extrabold text-on-surface dark:text-white tracking-tight">
                POS sales history
              </h1>
              <Badge variant="neutral">Staff</Badge>
            </div>
            <p className="text-on-surface-variant dark:text-neutral-400 mt-2 max-w-2xl">
              In-store counter sales with customer, line items, who rang the sale, and light edits (notes, due date, mark cash collected).
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}>
              <Icon name="refresh" className="text-sm" />
              Refresh
            </Button>
            <Button variant="secondary" asChild>
              <Link to={`${base}/sales`}>
                <Icon name="point_of_sale" className="text-sm" />
                Back to POS
              </Link>
            </Button>
          </div>
        </motion.header>

        {loading ? (
          <div className="flex justify-center py-24 text-secondary">
            <Icon name="progress_activity" className="text-4xl animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-surface-container dark:border-neutral-800 bg-surface-container-lowest dark:bg-[#1C1C1C] p-12 text-center text-on-surface-variant">
            No POS sales recorded yet.
          </div>
        ) : (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-surface-container dark:border-neutral-800 overflow-hidden bg-surface-container-lowest dark:bg-[#1C1C1C]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container dark:bg-neutral-900/80 text-[10px] uppercase tracking-widest text-outline font-bold">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Sold by</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container dark:divide-neutral-800">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container-low/80 dark:hover:bg-neutral-900/40">
                      <td className="px-4 py-3 font-mono font-semibold text-on-surface dark:text-white">{r.invoiceNumber}</td>
                      <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                        {formatDate(r.issueDate)}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="font-medium text-on-surface dark:text-neutral-200 truncate">{r.customerName || "—"}</div>
                        {r.customerEmail && (
                          <div className="text-[11px] text-outline truncate">{r.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{r.soldByName || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.totalAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(r.balanceDue) > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">{formatCurrency(r.balanceDue)}</span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button size="sm" variant="ghost" onClick={() => void openDetail(r.id)}>
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {detail && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <motion.button
                type="button"
                aria-label="Close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDetail(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative w-full max-w-lg h-full bg-white dark:bg-[#1C1C1C] shadow-2xl border-l border-surface-container dark:border-neutral-800 flex flex-col"
              >
                <div className="p-5 border-b border-surface-container dark:border-neutral-800 flex justify-between items-start gap-2">
                  <div>
                    <h2 className="font-headline font-bold text-lg text-on-surface dark:text-white">Sale detail</h2>
                    <p className="font-mono text-secondary text-sm mt-1">{detail.invoiceNumber}</p>
                  </div>
                  <button type="button" onClick={() => setDetail(null)} className="p-2 rounded-full hover:bg-surface-container">
                    <Icon name="close" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">Status</p>
                      <Badge variant={statusBadge(detail.status)} className="mt-1">{detail.status}</Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">Sold by</p>
                      <p className="font-medium mt-1">{detail.soldByName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">Customer</p>
                      <p className="font-medium mt-1">{detail.customerName || "Walk-in"}</p>
                      {detail.customerEmail && <p className="text-xs text-outline">{detail.customerEmail}</p>}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase">Due date</p>
                      <p className="font-medium mt-1">{detail.dueDate ? formatDate(detail.dueDate) : "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-surface-container-low dark:bg-neutral-900/50">
                      <span className="text-outline">Subtotal</span>
                      <p className="font-bold">{formatCurrency(detail.subtotal)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low dark:bg-neutral-900/50">
                      <span className="text-outline">Tax</span>
                      <p className="font-bold">{formatCurrency(detail.taxAmount)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low dark:bg-neutral-900/50">
                      <span className="text-outline">Discount</span>
                      <p className="font-bold">{formatCurrency(detail.discountAmount)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low dark:bg-neutral-900/50">
                      <span className="text-outline">Total</span>
                      <p className="font-bold">{formatCurrency(detail.totalAmount)}</p>
                    </div>
                  </div>
                  {detail.staffNotes && (
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase mb-1">Staff notes</p>
                      <p className="text-on-surface-variant whitespace-pre-wrap">{detail.staffNotes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-outline uppercase mb-2">Line items</p>
                    <ul className="space-y-2 border border-surface-container dark:border-neutral-800 rounded-lg divide-y divide-surface-container dark:divide-neutral-800">
                      {(detail.lines || []).map((line, idx) => (
                        <li key={idx} className="px-3 py-2 flex justify-between gap-2">
                          <span className="text-on-surface dark:text-neutral-200">{line.description}</span>
                          <span className="font-semibold shrink-0">{formatCurrency(line.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(detail.payments || []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase mb-2">Payments</p>
                      <ul className="text-xs space-y-1">
                        {detail.payments.map((p, idx) => (
                          <li key={idx} className="flex justify-between text-on-surface-variant">
                            <span>{formatDate(p.paidAtUtc)} · {p.paymentMethod || p.method}</span>
                            <span className="font-semibold text-on-surface dark:text-neutral-200">{formatCurrency(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editRow && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => !saving && setEditRow(null)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl border border-surface-container dark:border-neutral-800 p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-headline font-bold text-lg text-on-surface dark:text-white">Edit POS sale</h3>
                <p className="text-xs text-on-surface-variant font-mono">{editRow.invoiceNumber}</p>
                {editLoading ? (
                  <div className="flex justify-center py-8 text-secondary">
                    <Icon name="progress_activity" className="text-3xl animate-spin" />
                  </div>
                ) : (
                  <>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-outline uppercase">Staff notes</span>
                  <textarea
                    className="w-full min-h-[88px] rounded-lg border border-surface-container dark:border-neutral-700 bg-surface-container-lowest dark:bg-neutral-900 px-3 py-2 text-sm"
                    placeholder="Internal notes visible to staff…"
                    value={editForm.staffNotes}
                    onChange={(e) => setEditForm((f) => ({ ...f, staffNotes: e.target.value }))}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-outline uppercase">Due date (yyyy-mm-dd)</span>
                  <Input
                    type="date"
                    value={editForm.dueDateIso}
                    onChange={(e) => setEditForm((f) => ({ ...f, dueDateIso: e.target.value }))}
                  />
                </label>
                  </>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.markCollected}
                    onChange={(e) => setEditForm((f) => ({ ...f, markCollected: e.target.checked }))}
                    className="rounded border-surface-container"
                  />
                  <span className="text-sm text-on-surface dark:text-neutral-200">
                    Mark balance collected at counter (marks invoice paid)
                  </span>
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" disabled={saving || editLoading} onClick={() => setEditRow(null)}>
                    Cancel
                  </Button>
                  <Button disabled={saving || editLoading} onClick={() => void saveEdit()}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
