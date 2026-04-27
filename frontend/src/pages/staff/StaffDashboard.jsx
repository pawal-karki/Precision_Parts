import { cn as utilsCn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { store } from "@/lib/store";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { useToast } from "@/components/ui/toast";
import { useList } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
import { useTheme } from "@/lib/theme";
import {
  motion,
  PageTransition,
  StaggerList,
  FadeInItem,
  fadeInUp,
} from "@/components/ui/motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const dailySales = [
  { hour: "9AM", sales: 3 },
  { hour: "10AM", sales: 5 },
  { hour: "11AM", sales: 8 },
  { hour: "12PM", sales: 6 },
  { hour: "1PM", sales: 4 },
  { hour: "2PM", sales: 7 },
  { hour: "3PM", sales: 9 },
  { hour: "4PM", sales: 5 },
];

export default function StaffDashboard() {
  console.log("StaffDashboard updated v2");
  const { list: customers } = useList("customers");
  const { list: parts } = useList("partsInventory");
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
    Promise.all([api.getCustomers(), api.getParts()])
      .then(([cust, prt]) => {
        store.set("customers", Array.isArray(cust) ? cust : []);
        store.set("partsInventory", Array.isArray(prt) ? prt : []);
      })
      .catch(() => toast("Could not load dashboard data", "error"));
  }, []);

  const recentCustomers = customers.slice(0, 4);
  const lowStockParts = parts.filter((p) => p.stock < p.minStock);
  const creditOverdue = customers.filter((c) => c.credit > 0);

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
              Good Morning, Sarah
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
              Precision Parts Workshop &bull; Operational Summary
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="surface">
              <Icon name="calendar_today" className="text-sm" />
              Today
            </Button>
            <Link to="/staff/sales">
              <Button variant="secondary">
                <Icon name="add" className="text-sm" />
                New Sale
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* KPI Cards */}
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FadeInItem>
            <KpiCard icon="point_of_sale" label="Today's Sales" value="Rs. 4,28,000" trend="+8.3%" trendType="up" />
          </FadeInItem>
          <FadeInItem>
            <KpiCard icon="receipt_long" label="Transactions" value="23" trend="+3" trendType="up" />
          </FadeInItem>
          <FadeInItem>
            <KpiCard icon="people" label="Customers Served" value="18" trend="On Track" trendType="neutral" />
          </FadeInItem>
          <FadeInItem>
            <KpiCard icon="inventory" label="Items Sold" value="67" trend="+12%" trendType="up" />
          </FadeInItem>
        </StaggerList>

        {/* Quick Actions */}
        <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { to: "/staff/sales", icon: "point_of_sale", label: "New Sale", primary: true },
            { to: "/staff/customers", icon: "person_add", label: "Register Customer" },
            { to: "/staff/search", icon: "search", label: "Search Parts" },
            { to: "/staff/invoice", icon: "receipt", label: "View Invoices" },
          ].map((action) => (
            <FadeInItem key={action.to}>
              <Link
                to={action.to}
                className={utilsCn(
                  "rounded-2xl p-8 flex flex-col items-center gap-4 transition-all hover:scale-[1.02] shadow-sm border",
                  action.primary
                    ? "bg-secondary text-white border-secondary shadow-secondary/20"
                    : "bg-surface-container-low dark:bg-[#1C1C1C] border-surface-container-high dark:border-neutral-800 text-on-surface dark:text-neutral-300"
                )}
              >
                <Icon name={action.icon} className="text-4xl" />
                <span className="font-bold text-sm tracking-tight">{action.label}</span>
              </Link>
            </FadeInItem>
          ))}
        </StaggerList>

        {/* Main Data Grid */}
        <section className="grid grid-cols-12 gap-8">
          <motion.div
            className="col-span-12 lg:col-span-8 bg-surface-container-low dark:bg-[#1C1C1C] rounded-2xl p-8 dark:border dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold font-headline mb-8 dark:text-neutral-200">Today&apos;s Sales Activity</h3>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis 
                    dataKey="hour" 
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
                  <Bar dataKey="sales" fill="#4d6172" radius={[4, 4, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            className="col-span-12 lg:col-span-4 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-8 border border-surface-container-low dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-lg font-bold font-headline mb-8 dark:text-neutral-200">Recent Customers</h3>
            <div className="space-y-6">
              {recentCustomers.map((c, i) => (
                <motion.div
                  key={c.id}
                  className="flex items-center justify-between group cursor-pointer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-neutral-300 ring-2 ring-transparent group-hover:ring-secondary/20 transition-all">
                      {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-sm group-hover:text-secondary transition-colors dark:text-neutral-200">{c.name}</p>
                      <p className="text-[10px] text-on-surface-variant dark:text-neutral-500 uppercase tracking-widest font-bold">{c.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm dark:text-neutral-300">{c.totalSpent}</p>
                    <p className="text-[10px] text-on-surface-variant dark:text-neutral-500">{c.lastOrder}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Credits Due & Low Stock Alerts */}
          <motion.div
            className="col-span-12 lg:col-span-5 bg-gradient-to-br from-secondary/5 to-surface-container-low dark:from-secondary/10 dark:to-neutral-900 rounded-2xl p-8 border border-secondary/10 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Icon name="account_balance" className="text-secondary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Credits Overdue</h3>
              </div>
              <Badge variant="error" className="px-3 py-1 uppercase text-[10px] tracking-tighter">Immediate Attention</Badge>
            </div>
            <div className="space-y-4">
              {creditOverdue.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-4 text-center">No overdue credits</p>
              ) : (
                creditOverdue.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-white/20">
                    <span className="text-sm font-bold dark:text-neutral-300">{c.name}</span>
                    <span className="text-sm font-black text-error">{formatCurrency(c.credit)}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div
            className="col-span-12 lg:col-span-7 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-8 border border-surface-container-low dark:border-neutral-800/50 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold font-headline dark:text-neutral-200">Critical Inventory Alerts</h3>
              <Link to="/staff/search" className="text-[10px] font-bold uppercase text-secondary hover:underline">Manage Stock</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockParts.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-on-surface-variant">
                  <Icon name="check_circle" className="text-4xl text-emerald-500/50 mb-3" />
                  <p className="text-sm font-medium">All stock levels healthy</p>
                </div>
              ) : (
                lowStockParts.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-error-container/5 dark:bg-error/5 rounded-xl border border-error/10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <div className="flex items-center gap-4">
                      <Icon name="warning" className="text-error" />
                      <div>
                        <p className="text-sm font-bold dark:text-neutral-200 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant dark:text-neutral-500 font-mono font-bold tracking-tighter uppercase">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-error">{item.stock}</p>
                      <p className="text-[10px] text-on-surface-variant dark:text-neutral-500 font-bold uppercase tracking-tighter">Units</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </section>

        {/* Floating Action Button */}
        <motion.button
          className="fixed bottom-8 right-8 w-16 h-16 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-secondary-dim group"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => toast("Launching Sales POS...", "info")}
        >
          <Icon name="add" className="text-3xl" />
        </motion.button>
      </div>
    </PageTransition>
  );
}

function Badge({ children, variant, className }) {
  const styles = {
    error: "bg-error-container/20 text-error border-error/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    neutral: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
  };
  return (
    <span className={utilsCn("px-2 py-0.5 rounded-full text-[10px] font-bold border", styles[variant], className)}>
      {children}
    </span>
  );
}
   