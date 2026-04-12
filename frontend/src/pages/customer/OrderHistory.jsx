import { useState, useMemo, useEffect } from "react";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { motion, AnimatePresence, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const statusBadgeMap = {
  Delivered: { color: "text-emerald-600", dot: "bg-emerald-500", label: "Delivered" },
  Processing: { color: "text-secondary", dot: "bg-secondary-dim animate-pulse", label: "Processing" },
  Shipped: { color: "text-secondary", dot: "bg-secondary-dim animate-pulse", label: "In Transit" },
  Returned: { color: "text-error", dot: "bg-error", label: "Returned" },
  Complete: { color: "text-emerald-600", dot: "bg-emerald-500", label: "Complete" },
};

const filterOptions = ["All", "Delivered", "Processing", "Shipped", "Returned"];

function parseAmount(str) {
  if (typeof str === "number") return str;
  return parseFloat(String(str).replace(/[$,]/g, "")) || 0;
}

export default function OrderHistory() {
  const { list: orders } = useList("orderHistory");
  const toast = useToast();

  useEffect(() => {
    api
      .getOrderHistory()
      .then((rows) => store.set("orderHistory", Array.isArray(rows) ? rows : []))
      .catch(() => toast("Could not load orders from API", "error"));
  }, []);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

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
      const key = d.toLocaleDateString("en-US", { month: "short" });
      monthMap[key] = (monthMap[key] || 0) + parseAmount(o.total);
    });
    return Object.entries(monthMap)
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
      .slice(0, 8);
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

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header variants={fadeInUp} initial="initial" animate="animate">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-surface dark:text-white">
            Order History
          </h1>
          <p className="text-on-surface-variant dark:text-stone-400 font-medium mt-1">
            Audit log of precision components and maintenance workflows.
          </p>
        </motion.header>

        {/* AI Intelligence Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Part Failure Probability Card */}
          <motion.div
            className="lg:col-span-7 bg-surface-container-lowest dark:bg-stone-900 rounded-xl p-8 flex flex-col relative overflow-hidden group"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-secondary/10 transition-colors duration-500" />
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 text-secondary mb-1">
                  <Icon name="analytics" />
                  <span className="text-xs font-bold uppercase tracking-widest">Predictive Analysis</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-on-surface dark:text-white">
                  Part Failure Probability
                </h3>
              </div>
              <div className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-bold">
                HIGH ACCURACY
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-5xl font-extrabold font-headline text-on-surface dark:text-white tracking-tighter">
                  {failureProbability}%
                </span>
                <div className="flex flex-col">
                  <span className="text-error font-bold text-sm flex items-center">
                    <Icon name="trending_up" className="text-sm mr-1" />
                    +2.1%
                  </span>
                  <span className="text-on-surface-variant text-xs font-medium">Aggregated fleet risk</span>
                </div>
              </div>
              {/* Bar Chart */}
              <div className="h-32 w-full flex items-end justify-between gap-2 px-2">
                {spendingData.map((d, i) => {
                  const maxVal = Math.max(...spendingData.map((s) => s.amount), 1);
                  const height = Math.max((d.amount / maxVal) * 100, 5);
                  const isLast = i >= spendingData.length - 2;
                  return (
                    <motion.div
                      key={d.month}
                      className={`w-full rounded-t-sm transition-colors ${
                        isLast ? "bg-secondary-fixed-dim" : "bg-surface-container-low dark:bg-stone-800 hover:bg-secondary-fixed"
                      }`}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant uppercase tracking-tighter font-bold mt-2">
                {spendingData.map((d) => (
                  <span key={d.month}>{d.month}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Maintenance Intelligence Card */}
          <motion.div
            className="lg:col-span-5 bg-surface-container-low dark:bg-stone-900 rounded-xl p-8 flex flex-col border border-outline-variant/10"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-secondary mb-4">
              <Icon name="smart_toy" />
              <span className="text-xs font-bold uppercase tracking-widest">AI Recommendations</span>
            </div>
            <h3 className="text-2xl font-bold font-headline text-on-surface dark:text-white mb-6">
              Maintenance Intelligence
            </h3>
            <div className="space-y-4 flex-1">
              {[
                { icon: "oil_barrel", title: "Hydraulic Seal Replacement", sub: "Optimal Window: 14 Days", bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
                { icon: "settings_input_component", title: "Core Module Calibration", sub: "Recommended after Order #7721", bg: "bg-secondary-container", text: "text-on-secondary-container" },
                { icon: "history", title: "Fluid Flush (System A)", sub: "Completed 12/05/23", bg: "bg-surface-container", text: "text-on-surface-variant", dim: true },
              ].map((item) => (
                <div key={item.title} className={`p-4 bg-surface-container-lowest dark:bg-stone-800 rounded-lg flex items-center gap-4 ${item.dim ? "opacity-60" : ""}`}>
                  <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center ${item.text}`}>
                    <Icon name={item.icon} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-on-surface dark:text-white">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant">{item.sub}</p>
                  </div>
                  {!item.dim && (
                    <button className="text-secondary hover:text-primary transition-colors">
                      <Icon name="chevron_right" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-6 w-full py-3 bg-primary dark:bg-stone-700 text-on-primary dark:text-white rounded-lg font-bold text-sm hover:bg-primary-dim transition-all active:scale-[0.98]">
              View Strategy Report
            </button>
          </motion.div>
        </div>

        {/* Detailed Order Log Table */}
        <motion.section
          className="bg-surface-container-lowest dark:bg-stone-900 rounded-xl overflow-hidden shadow-sm"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <div className="px-8 py-6 flex justify-between items-center border-b border-surface-container dark:border-stone-800">
            <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">Detailed Order Log</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-bold border border-outline-variant/30 dark:border-stone-700 rounded hover:bg-surface-container dark:hover:bg-stone-800 transition-colors"
              >
                Export CSV
              </button>
              <div className="flex gap-1">
                {filterOptions.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setActiveFilter(f); setCurrentPage(1); }}
                    className={`px-3 py-2 text-xs font-bold rounded transition-colors ${
                      activeFilter === f
                        ? "bg-primary dark:bg-secondary text-on-primary"
                        : "bg-surface-container-high dark:bg-stone-800 text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-stone-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low dark:bg-stone-800/50">
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Date</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Order ID</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Category</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Item / Service</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Status</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container dark:divide-stone-800">
                <AnimatePresence mode="popLayout">
                  {paginatedOrders.length === 0 && (
                    <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan={6} className="px-8 py-12 text-center text-on-surface-variant">
                        No orders found for this filter.
                      </td>
                    </motion.tr>
                  )}
                  {paginatedOrders.map((order, i) => {
                    const badge = statusBadgeMap[order.status] || statusBadgeMap.Delivered;
                    return (
                      <motion.tr
                        key={order.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: i * 0.03 } }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-background dark:hover:bg-stone-800/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-8 py-5 text-sm font-medium text-on-surface dark:text-stone-200">{order.date}</td>
                        <td className="px-8 py-5 text-sm font-mono text-secondary">{order.id}</td>
                        <td className="px-8 py-5">
                          <span className="px-2 py-1 bg-surface-container dark:bg-stone-700 text-[10px] font-bold rounded uppercase">
                            Hardware
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-on-surface dark:text-white">{order.items}</p>
                          <p className="text-[10px] text-on-surface-variant">Serial: {order.id}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`flex items-center ${badge.color} font-bold text-xs uppercase tracking-tight`}>
                            <span className={`w-2 h-2 rounded-full ${badge.dot} mr-2`} />
                            {badge.label}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-right text-on-surface dark:text-white">
                          {order.total}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-surface-container-low dark:bg-stone-800/30 flex justify-between items-center">
            <span className="text-xs text-on-surface-variant font-medium">
              Showing {Math.min((currentPage - 1) * perPage + 1, filtered.length)}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded bg-surface-container-highest dark:bg-stone-700 text-on-surface hover:bg-outline-variant/30 transition-colors disabled:opacity-40"
              >
                <Icon name="chevron_left" className="text-sm" />
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded font-bold text-xs transition-colors ${
                    currentPage === page
                      ? "bg-primary dark:bg-secondary text-on-primary"
                      : "bg-surface-container-highest dark:bg-stone-700 text-on-surface hover:bg-outline-variant/30"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-surface-container-highest dark:bg-stone-700 text-on-surface hover:bg-outline-variant/30 transition-colors disabled:opacity-40"
              >
                <Icon name="chevron_right" className="text-sm" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Order Detail Modal */}
        <Modal
          open={selectedOrder !== null}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder?.id || ""}`}
        >
          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Order ID</p>
                  <p className="text-sm font-mono font-bold mt-1">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Date</p>
                  <p className="text-sm mt-1">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Status</p>
                  <p className="text-sm font-bold mt-1">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Total</p>
                  <p className="text-sm font-bold mt-1">{selectedOrder.total}</p>
                </div>
              </div>
              <div className="border-t border-surface-container pt-4">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">Items</p>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-sm">{selectedOrder.items}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    toast("Reorder placed for " + selectedOrder.id, "success");
                    setSelectedOrder(null);
                  }}
                >
                  <Icon name="replay" className="text-sm" />
                  Reorder
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
       