import { useMemo, useState, useEffect } from "react";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const statusBadgeMap = {
  Delivered: { color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Delivered" },
  Processing: { color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500 animate-pulse", label: "Processing" },
  Shipped: { color: "text-secondary", dot: "bg-secondary animate-pulse", label: "In Transit" },
  Returned: { color: "text-error", dot: "bg-error", label: "Returned" },
  Complete: { color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Complete" },
};

const filterOptions = ["All", "Delivered", "Processing", "Shipped", "Returned"];

function parseAmount(str) {
  if (typeof str === "number") return str;
  return parseFloat(String(str).replace(/[Rs.,\s$]/g, "")) || 0;
}

function fmtNPR(n) {
  return `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderHistory() {
  const { list: orders } = useList("orderHistory");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api
      .getOrderHistory()
      .then((rows) => {
        store.set("orderHistory", Array.isArray(rows) ? rows : []);
      })
      .catch(() => toast("Could not load orders from API", "error"))
      .finally(() => setLoading(false));
  }, []);

  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(
    () => (activeFilter === "All" ? orders : orders.filter((o) => o.status === activeFilter)),
    [orders, activeFilter]
  );

  const totalSpent = useMemo(
    () => orders.reduce((sum, o) => sum + parseAmount(o.total), 0),
    [orders]
  );

  const spendingData = useMemo(() => {
    const monthMap = {};
    orders.forEach((o) => {
      if (!o.date) return;
      const d = new Date(o.date);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthMap[key] = (monthMap[key] || 0) + parseAmount(o.total);
    });
    return Object.entries(monthMap)
      .map(([month, amount]) => ({ month, amount: Math.round(amount) }))
      .slice(-8);
  }, [orders]);

  const failureProbability = useMemo(() => {
    const total = orders.length;
    if (total === 0) return 0;
    const returned = orders.filter((o) => o.status === "Returned").length;
    return ((returned / total) * 100).toFixed(1);
  }, [orders]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / perPage);

  const handleExportCSV = () => {
    const header = "Order ID,Date,Items,Status,Total\n";
    const rows = orders
      .map((o) => `${o.id},${o.date},"${o.items}",${o.status},${o.total}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "order_history.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported successfully", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-secondary">
        <Icon name="progress_activity" className="text-4xl animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <motion.header variants={fadeInUp} initial="initial" animate="animate">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-headline text-on-surface dark:text-white">
            Order History
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-400 font-medium mt-1">
            Audit log of precision components and maintenance workflows.
          </p>
        </motion.header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: orders.length, icon: "receipt_long" },
            { label: "Total Spent", value: fmtNPR(totalSpent), icon: "payments" },
            { label: "Delivered", value: orders.filter(o => o.status === "Delivered" || o.status === "Complete").length, icon: "check_circle" },
            { label: "Return Rate", value: `${failureProbability}%`, icon: "undo" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-5 border border-surface-container dark:border-neutral-800/50"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon name={stat.icon} className="text-secondary text-sm" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{stat.label}</span>
              </div>
              <p className="text-xl font-extrabold font-headline text-on-surface dark:text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Spending Chart */}
        {spendingData.length > 0 && (
          <motion.div
            className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container dark:border-neutral-800/50"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-base font-bold font-headline text-on-surface dark:text-white mb-4">Spending Over Time</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [fmtNPR(value), "Amount"]} />
                  <Line type="monotone" dataKey="amount" stroke="var(--md-sys-color-secondary)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Order Table */}
        <motion.section
          className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl overflow-hidden shadow-sm border border-surface-container dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <div className="px-6 py-5 flex flex-col md:flex-row gap-4 justify-between md:items-center border-b border-surface-container dark:border-neutral-800/50">
            <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">Detailed Order Log</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-bold border border-outline-variant/30 dark:border-neutral-700/50 rounded-lg hover:bg-surface-container dark:hover:bg-neutral-800 transition-colors"
              >
                Export CSV
              </button>
              <div className="flex gap-1 flex-wrap">
                {filterOptions.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      activeFilter === f
                        ? "bg-primary dark:bg-secondary text-on-primary"
                        : "bg-surface-container-high dark:bg-neutral-800 text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-neutral-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-surface-container-low dark:bg-neutral-800/50">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Date</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Order ID</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Item / Service</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container dark:divide-neutral-800/50">
                <AnimatePresence mode="popLayout">
                  {paginatedOrders.length === 0 && (
                    <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                        <Icon name="search_off" className="text-4xl mb-2 block mx-auto" />
                        No orders found for this filter.
                      </td>
                    </motion.tr>
                  )}
                  {paginatedOrders.map((order, i) => {
                    const badge = statusBadgeMap[order.status] || statusBadgeMap.Delivered;
                    return (
                      <motion.tr
                        key={order.id || i}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.03 } }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-background dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-6 py-4 text-sm text-on-surface dark:text-neutral-200">{order.date}</td>
                        <td className="px-6 py-4 text-sm font-mono text-secondary">{order.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-on-surface dark:text-white">{order.items}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${badge.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-on-surface dark:text-white">
                          {typeof order.total === "number" ? fmtNPR(order.total) : order.total}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container dark:border-neutral-800/50">
              <p className="text-sm text-on-surface-variant">
                Page {currentPage} of {totalPages} · {filtered.length} orders
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  <Icon name="chevron_left" className="text-sm" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm rounded-lg text-on-surface-variant hover:bg-surface-container dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                >
                  <Icon name="chevron_right" className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.id}`} size="md">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Date</p>
                <p className="font-semibold text-on-surface dark:text-white">{selectedOrder.date}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${(statusBadgeMap[selectedOrder.status] || statusBadgeMap.Delivered).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(statusBadgeMap[selectedOrder.status] || statusBadgeMap.Delivered).dot}`} />
                  {(statusBadgeMap[selectedOrder.status] || statusBadgeMap.Delivered).label}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Items</p>
                <p className="font-semibold text-on-surface dark:text-white">{selectedOrder.items}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Total</p>
                <p className="font-extrabold text-lg text-on-surface dark:text-white">
                  {typeof selectedOrder.total === "number" ? fmtNPR(selectedOrder.total) : selectedOrder.total}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-surface-container dark:border-neutral-800/50">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}