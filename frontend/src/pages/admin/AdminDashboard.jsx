import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { KpiCard } from "@/components/ui/kpi-card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
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
import { formatCurrency } from "@/lib/currency";

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [topParts, setTopParts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const { dark } = useTheme();
  const toast = useToast();

  const chartTheme = useMemo(() => ({
    axis: dark ? "#737373" : "#5a605e",
    grid: dark ? "rgba(255,255,255,0.05)" : "#ecefec",
    tooltip: {
      bg: dark ? "#171717" : "#fff",
      border: dark ? "#262626" : "#ecefec",
      text: dark ? "#f5f5f5" : "#2d3432"
    }
  }), [dark]);

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
      <div className="flex flex-col gap-12">
        {/* Header */}
        <motion.section
          className="flex flex-col md:flex-row justify-between md:items-end items-start gap-4"
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
              value={formatCurrency(Number(String(kpis.totalRevenue.value).replace(/[^0-9.-]+/g, "")))}
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
            className="col-span-12 lg:col-span-8 bg-surface-container-low dark:bg-[#1C1C1C] rounded-2xl p-8 dark:border dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold font-headline dark:text-neutral-200">Revenue Growth & Projections</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-xs font-medium text-on-surface-variant dark:text-neutral-500">Actual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-outline-variant dark:bg-neutral-700" />
                  <span className="text-xs font-medium text-on-surface-variant dark:text-neutral-500">Projected</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: chartTheme.axis, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: chartTheme.axis, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.bg,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      borderRadius: 12,
                      fontSize: 12,
                      color: chartTheme.tooltip.text,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: chartTheme.tooltip.text }}
                  />
                  <Bar dataKey="actual" fill="#4d6172" radius={[4, 4, 0, 0]} animationDuration={800} />
                  <Bar dataKey="projected" fill={dark ? "#404040" : "#adb3b0"} radius={[4, 4, 0, 0]} animationDuration={800} animationBegin={200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Revenue Distribution */}
          <motion.div
            className="col-span-12 lg:col-span-4 bg-surface-container-low dark:bg-[#1C1C1C] rounded-2xl p-8 flex flex-col dark:border dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold font-headline mb-8 dark:text-neutral-200">Revenue Distribution</h3>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1000}
                    paddingAngle={4}
                  >
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.bg,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      borderRadius: 10,
                      fontSize: 12,
                      color: chartTheme.tooltip.text,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {distribution.map((item, i) => (
                <motion.div
                  key={item.name}
                  className="flex justify-between items-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-sm font-medium text-on-surface dark:text-neutral-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-on-surface dark:text-neutral-100">{item.value}%</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top Parts */}
          <motion.div
            className="col-span-12 lg:col-span-6 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-8 border border-surface-container-low dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-bold font-headline mb-8 dark:text-neutral-200">High-Frequency Components</h3>
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
                    <span className="font-semibold text-on-surface dark:text-neutral-300">{part.name}</span>
                    <span className="text-on-surface-variant dark:text-neutral-500 font-medium">{part.units} Units</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container-low dark:bg-neutral-800/50 rounded-full overflow-hidden">
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
            className="col-span-12 lg:col-span-6 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-8 border border-surface-container-low dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold font-headline dark:text-neutral-200">System Alerts</h3>
              <Badge variant="error" className="px-3 py-1">Critical</Badge>
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] ${
                    alert.severity === "error"
                      ? "bg-error-container/10 border border-error/10"
                      : alert.severity === "tertiary"
                      ? "bg-tertiary-container/30 border border-tertiary/10"
                      : "bg-surface-container-low dark:bg-neutral-800/40 border border-transparent dark:border-neutral-700/30"
                  }`}
                >
                  <Icon
                    name={alert.type === "error" ? "event_busy" : alert.type === "warning" ? "warning" : "info"}
                    className={
                      alert.severity === "error"
                        ? "text-error"
                        : alert.severity === "tertiary"
                        ? "text-tertiary"
                        : "text-on-surface-variant dark:text-neutral-500"
                    }
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${alert.severity === "error" ? "text-error" : "dark:text-neutral-200"}`}>
                      {alert.title}
                    </p>
                    <p className="text-xs text-on-surface-variant dark:text-neutral-500">{alert.description}</p>
                  </div>
                  <button
                    onClick={() => handleAlertAction(alert)}
                    className="text-[10px] font-bold uppercase text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors"
                  >
                    {alert.action}
                  </button>
                </motion.div>
              ))}
              {alerts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-on-surface-variant dark:text-neutral-500"
                >
                  <Icon name="check_circle" className="text-4xl text-emerald-500/50 mb-3" />
                  <p className="text-sm font-medium">All clear! No active alerts.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Activity Ledger */}
        <motion.section
          className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-8 dark:border dark:border-neutral-800/50 shadow-sm"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-extrabold font-headline mb-8 dark:text-neutral-100">Activity Ledger</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <tr className="text-[10px] font-bold uppercase text-on-surface-variant dark:text-neutral-500 border-b border-surface-container dark:border-neutral-800">
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
                      <TableCell className="font-medium dark:text-neutral-300">{item.description}</TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold text-slate-500 dark:text-neutral-500">
                        {item.reference}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/admin/audit-log"
              className="text-sm font-bold text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors inline-flex items-center justify-center gap-2 mx-auto"
            >
              View full audit log
              <Icon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
        </motion.section>
      </div>
    </PageTransition>
  );
}
      