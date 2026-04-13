import { useEffect } from "react";
import { Link } from "react-router-dom";
import { store } from "@/lib/store";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { useToast } from "@/components/ui/toast";
import { useList } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
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
  const { list: customers } = useList("customers");
  const { list: parts } = useList("partsInventory");
  const toast = useToast();

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
      <motion.section
        className="flex justify-between items-end"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline">
            Good Morning, Sarah
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Here&apos;s your daily operational summary.
          </p>
        </div>
        <Button variant="surface">
          <Icon name="calendar_today" className="text-sm" />
          Today
        </Button>
      </motion.section>

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
      <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FadeInItem>
          <Link
            to="/staff/sales"
            className="bg-secondary text-on-secondary rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-secondary-dim transition-all group"
          >
            <Icon name="point_of_sale" className="text-3xl" />
            <span className="font-bold text-sm">New Sale</span>
          </Link>
        </FadeInItem>
        <FadeInItem>
          <Link
            to="/staff/customers"
            className="bg-surface-container-lowest dark:bg-[#1C1C1C] border border-surface-container-low dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-surface-container-low dark:hover:bg-neutral-800 transition-all"
          >
            <Icon name="person_add" className="text-3xl text-secondary" />
            <span className="font-bold text-sm">Register Customer</span>
          </Link>
        </FadeInItem>
        <FadeInItem>
          <Link
            to="/staff/search"
            className="bg-surface-container-lowest dark:bg-[#1C1C1C] border border-surface-container-low dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-surface-container-low dark:hover:bg-neutral-800 transition-all"
          >
            <Icon name="search" className="text-3xl text-secondary" />
            <span className="font-bold text-sm">Search Parts</span>
          </Link>
        </FadeInItem>
        <FadeInItem>
          <Link
            to="/staff/invoice"
            className="bg-surface-container-lowest dark:bg-[#1C1C1C] border border-surface-container-low dark:border-neutral-800 rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-surface-container-low dark:hover:bg-neutral-800 transition-all"
          >
            <Icon name="receipt" className="text-3xl text-secondary" />
            <span className="font-bold text-sm">View Invoices</span>
          </Link>
        </FadeInItem>
      </StaggerList>

      <section className="grid grid-cols-12 gap-8">
        <motion.div
          className="col-span-12 lg:col-span-7 bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-8 dark:border dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold font-headline mb-6">Today&apos;s Sales Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailySales} barCategoryGap={8}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #ecefec", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="sales" fill="#4d6172" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="col-span-12 lg:col-span-5 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-lg font-bold font-headline mb-6">Recent Customers</h3>
          <div className="divide-y divide-surface-container-low dark:divide-neutral-800/50">
            {recentCustomers.map((c, i) => (
              <motion.div
                key={c.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-neutral-300">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{c.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{c.totalSpent}</p>
                  <p className="text-[10px] text-on-surface-variant">{c.lastOrder}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Credits Due */}
        <motion.div
          className="col-span-12 lg:col-span-5 bg-gradient-to-br from-secondary-dim/20 to-surface-container-low dark:from-secondary-dim/20 dark:to-neutral-900 rounded-xl p-6 border border-secondary-dim/30"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Icon name="account_balance" className="text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">Credits Due</h3>
          </div>
          <div className="space-y-3">
            {creditOverdue.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No overdue credits</p>
            ) : (
              creditOverdue.map((c) => (
                <div key={c.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-sm font-bold text-error">{formatCurrency(c.credit)}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Low Stock */}
        <motion.div
          className="col-span-12 lg:col-span-7 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.45 }}
        >
          <h3 className="text-lg font-bold font-headline mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStockParts.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant">
                <Icon name="check_circle" className="text-3xl text-emerald-500 mb-2" />
                <p className="text-sm">All stock levels healthy</p>
              </div>
            ) : (
              lowStockParts.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-error-container/10 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                >
                  <div className="flex items-center gap-3">
                    <Icon name="warning" className="text-error" />
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-error">{item.stock} / {item.minStock}</p>
                    <p className="text-[10px] text-on-surface-variant">Current / Min</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      <motion.button
        className="fixed bottom-8 right-8 w-14 h-14 bg-secondary hover:bg-secondary-dim text-white rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => toast("Quick action menu coming soon!", "info")}
      >
        <Icon name="add" className="text-2xl" />
      </motion.button>
    </PageTransition>
  );
}
   