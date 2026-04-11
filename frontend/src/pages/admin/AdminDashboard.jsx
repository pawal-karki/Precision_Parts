import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/ui/kpi-card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
  motion,
  PageTransition,
  StaggerList,
  FadeInItem,
  fadeInUp,
  staggerContainer,
} from "@/components/ui/motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { generateReportPdf, downloadPdf } from "@/lib/pdf";

const PIE_COLORS = ["#4d6172", "#5e5e5e", "#dee4e0"];

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [topParts, setTopParts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.getAdminKpis(),
      api.getRevenueData(),
      api.getDistribution(),
      api.getTopParts(),
      api.getAlerts(),
      api.getActivity(),
    ]).then(([k, r, d, t, a, act]) => {
      setKpis(k);
      setRevenue(r);
      setDistribution(d);
      setTopParts(t);
      setAlerts(a);
      setActivity(act);
    });
  }, []);

  const handleExport = () => {
    try {
      const doc = generateReportPdf(
        "Admin Dashboard Report",
        ["Metric", "Value", "Trend"],
        [
          ["Total Revenue", kpis.totalRevenue.value, kpis.totalRevenue.trend],
          ["Total Sales", kpis.totalSales.value, kpis.totalSales.trend],
          ["Active Customers", kpis.activeCustomers.value, kpis.activeCustomers.trend],
          ["Low Stock Items", kpis.lowStockItems.value, kpis.lowStockItems.trend],
        ]
      );
      downloadPdf(doc, "admin-dashboard-report.pdf");
      toast("Dashboard report exported as PDF", "success");
    } catch {
      toast("Failed to export report", "error");
    }
  };

  const handleAlertAction = (alert) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    toast(`${alert.action} action taken on: ${alert.title}`, "success");
  };

  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Icon name="sync" className="text-3xl text-secondary" />
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* Header */}
      <motion.section
        className="flex justify-between items-end"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
            Performance Ledger
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Operational overview for Precision Parts Workshop Hub.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="surface">
            <Icon name="calendar_today" className="text-sm" />
            Last 30 Days
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Icon name="download" className="text-sm" />
            Export Report
          </Button>
        </div>
      </motion.section>

      {/* KPI Cards */}
      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FadeInItem>
          <KpiCard
            icon="payments"
            label="Total Revenue"
            value={kpis.totalRevenue.value}
            trend={kpis.totalRevenue.trend}
            trendType={kpis.totalRevenue.type}
          />
        </FadeInItem>
        <FadeInItem>
          <KpiCard
            icon="shopping_cart"
            label="Total Sales"
            value={kpis.totalSales.value}
            trend={kpis.totalSales.trend}
            trendType={kpis.totalSales.type}
          />
        </FadeInItem>
        <FadeInItem>
          <KpiCard
            icon="group"
            label="Active Customers"
            value={kpis.activeCustomers.value}
            trend={kpis.activeCustomers.trend}
            trendType={kpis.activeCustomers.type}
          />
        </FadeInItem>
        <FadeInItem>
          <KpiCard
            icon="inventory"
            label="Low Stock Items"
            value={kpis.lowStockItems.value}
            trend={kpis.lowStockItems.trend}
            trendType={kpis.lowStockItems.type}
          />
        </FadeInItem>
      </StaggerList>

      {/* Main Data Grid */}
      <section className="grid grid-cols-12 gap-8">
        {/* Revenue Chart */}
        <motion.div
          className="col-span-12 lg:col-span-8 bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-8 dark:border dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold font-headline">Revenue Growth & Projections</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-xs font-medium text-on-surface-variant">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-outline-variant" />
                <span className="text-xs font-medium text-on-surface-variant">Projected</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenue} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecefec" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #ecefec",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="actual" fill="#4d6172" radius={[4, 4, 0, 0]} animationDuration={800} />
              <Bar dataKey="projected" fill="#adb3b0" radius={[4, 4, 0, 0]} animationDuration={800} animationBegin={200} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue Distribution */}
        <motion.div
          className="col-span-12 lg:col-span-4 bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-8 flex flex-col dark:border dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold font-headline mb-8">Revenue Distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1000}
                >
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
            {distribution.map((item, i) => (
              <motion.div
                key={item.name}
                className="flex justify-between items-center"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.value}%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Parts */}
        <motion.div
          className="col-span-12 lg:col-span-6 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-8 border border-surface-container-low dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-bold font-headline mb-6">High-Frequency Components</h3>
          <div className="space-y-6">
            {topParts.map((part, i) => (
              <motion.div
                key={part.name}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{part.name}</span>
                  <span className="text-on-surface-variant">{part.units} Units</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-secondary h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${part.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Alerts Panel */}
        <motion.div
          className="col-span-12 lg:col-span-6 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-8 border border-surface-container-low dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-headline">System Alerts</h3>
            <Badge variant="error">Critical</Badge>
          </div>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  alert.severity === "error"
                    ? "bg-error-container/10"
                    : alert.severity === "tertiary"
                    ? "bg-tertiary-container/30"
                    : "bg-surface-container-low dark:bg-neutral-800/50"
                }`}
              >
                <Icon
                  name={alert.type === "error" ? "event_busy" : alert.type === "warning" ? "warning" : "info"}
                  className={
                    alert.severity === "error"
                      ? "text-error"
                      : alert.severity === "tertiary"
                      ? "text-tertiary"
                      : "text-on-surface-variant"
                  }
                />
                <div className="flex-1">
                  <p className={`text-sm font-bold ${alert.severity === "error" ? "text-error" : ""}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-on-surface-variant">{alert.description}</p>
                </div>
                <button
                  onClick={() => handleAlertAction(alert)}
                  className="text-[10px] font-bold uppercase text-secondary hover:underline"
                >
                  {alert.action}
                </button>
              </motion.div>
            ))}
            {alerts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6 text-on-surface-variant"
              >
                <Icon name="check_circle" className="text-3xl text-emerald-500 mb-2" />
                <p className="text-sm font-medium">All clear! No active alerts.</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Activity Ledger */}
      <motion.section
        className="bg-white dark:bg-[#1C1C1C] rounded-xl p-8 dark:border dark:border-neutral-800/50"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-extrabold font-headline mb-8">Activity Ledger</h3>
        <Table>
          <TableHeader>
            <tr className="text-[10px] font-bold uppercase text-on-surface-variant border-b border-surface-container dark:border-neutral-800">
              <TableHead>Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Reference</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {activity.map((item, i) => (
              <motion.tr
                key={item.id}
                className="group hover:bg-background dark:hover:bg-neutral-800/20 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
              >
                <TableCell className="text-xs font-medium text-slate-400 dark:text-neutral-500">
                  {item.timestamp}
                </TableCell>
                <TableCell>
                  <Badge variant={item.badge}>{item.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-right text-xs font-mono font-bold text-slate-500 dark:text-neutral-500">
                  {item.reference}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
        <div className="mt-6 text-center">
          <Link
            to="/admin/audit-log"
            className="text-sm font-bold text-secondary hover:text-primary transition-colors inline-flex items-center justify-center gap-2 mx-auto"
          >
            View full audit log
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
      </motion.section>
    </PageTransition>
  );
}
      