import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

/* ─── helpers ─────────────────────────────────────────────────────── */
function parseMoney(val) {
  if (typeof val === "number") return val;
  return parseFloat(String(val || "0").replace(/[Rs.,\s$]/g, "")) || 0;
}

function fmtNPR(n) {
  return formatCurrency(n);
}

/* ─── tier config ─────────────────────────────────────────────────── */
const TIERS = [
  {
    name: "Bronze",
    icon: "workspace_premium",
    minSpend: 0,
    maxSpend: 4999,
    color: "from-amber-700 to-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700/40",
    text: "text-amber-700 dark:text-amber-400",
    perks: ["Early booking access", "Priority support chat"],
  },
  {
    name: "Silver",
    icon: "star",
    minSpend: 5000,
    maxSpend: 14999,
    color: "from-slate-400 to-slate-300",
    bg: "bg-slate-50 dark:bg-slate-800/30",
    border: "border-slate-200 dark:border-slate-600/40",
    text: "text-slate-600 dark:text-slate-300",
    perks: ["10% discount on all orders ≥ Rs. 5,000", "Priority support chat", "Monthly summary report"],
  },
  {
    name: "Gold",
    icon: "workspace_premium",
    minSpend: 15000,
    maxSpend: Infinity,
    color: "from-yellow-500 to-amber-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-700/40",
    text: "text-yellow-700 dark:text-yellow-400",
    perks: ["10% discount on ALL orders", "Dedicated account manager", "Free delivery on every order", "Annual loyalty gift"],
  },
];

function getTier(totalSpent) {
  return TIERS.slice().reverse().find((t) => totalSpent >= t.minSpend) || TIERS[0];
}

function getNextTier(totalSpent) {
  return TIERS.find((t) => t.minSpend > totalSpent) || null;
}

/* ─── sub-components ──────────────────────────────────────────────── */
function TierBadge({ tier, size = "md" }) {
  const sizeClass = size === "lg" ? "w-16 h-16 text-3xl" : "w-10 h-10 text-xl";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
      <Icon name={tier.icon} filled className="text-white" />
    </div>
  );
}

function SpendProgress({ totalSpent, tier, nextTier }) {
  const progress = nextTier
    ? Math.min(100, ((totalSpent - tier.minSpend) / (nextTier.minSpend - tier.minSpend)) * 100)
    : 100;
  const remaining = nextTier ? nextTier.minSpend - totalSpent : 0;

  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-2">
        <span className={tier.text}>{tier.name}</span>
        {nextTier ? (
          <span className="text-on-surface-variant dark:text-neutral-400">{nextTier.name}</span>
        ) : (
          <span className="text-yellow-600 dark:text-yellow-400">Max Tier 🏆</span>
        )}
      </div>
      <div className="h-3 bg-surface-container-high dark:bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs text-on-surface-variant dark:text-neutral-500 mt-1.5">
        <span>{fmtNPR(totalSpent)}</span>
        {nextTier && <span>{fmtNPR(remaining)} more to unlock {nextTier.name}</span>}
      </div>
    </div>
  );
}

function DiscountBanner({ eligible, singleOrderMax }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-6 flex items-start gap-4 border-2 ${
        eligible
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700/50"
          : "bg-surface-container-low dark:bg-[#1C1C1C] border-outline-variant/30 dark:border-neutral-800"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
        eligible ? "bg-emerald-500 text-white" : "bg-surface-container-high dark:bg-neutral-700 text-on-surface-variant"
      }`}>
        <Icon name={eligible ? "verified" : "lock"} filled className="text-2xl" />
      </div>
      <div className="flex-1">
        <h3 className={`font-headline font-bold text-lg ${eligible ? "text-emerald-700 dark:text-emerald-400" : "text-on-surface dark:text-white"}`}>
          {eligible ? "🎉 10% Discount Unlocked!" : "Unlock 10% Discount"}
        </h3>
        <p className={`text-sm mt-1 ${eligible ? "text-emerald-600 dark:text-emerald-500" : "text-on-surface-variant dark:text-neutral-400"}`}>
          {eligible
            ? `Your highest single purchase was ${fmtNPR(singleOrderMax)}. You qualify for 10% off on purchases ≥ Rs. 5,000!`
            : `Spend Rs. 5,000 or more in a single purchase to activate your 10% loyalty discount. Current best: ${fmtNPR(singleOrderMax)}.`}
        </p>
        {eligible && (
          <div className="mt-3 inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full px-4 py-1.5 text-sm font-bold">
            <Icon name="local_offer" className="text-sm" />
            Discount auto-applies at checkout
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── System Alert Banner ──────────────────────────────────────────── */
function SystemAlerts({ overdueCredit, hasLowStock }) {
  const [dismissed, setDismissed] = useState([]);

  const alerts = [
    overdueCredit && {
      id: "credit",
      type: "warning",
      icon: "credit_card_off",
      title: "Overdue Credit Reminder",
      message: "You have an unpaid credit balance outstanding for more than 1 month. Please clear your balance to avoid account restrictions.",
      action: { label: "View Payments", href: "/customer/payments" },
    },
    hasLowStock && {
      id: "lowstock",
      type: "info",
      icon: "inventory_2",
      title: "Low Stock Alert",
      message: "Some parts you've previously ordered are running low (< 10 units). Order soon to avoid delays in your next service.",
      action: { label: "Browse Parts", href: "/customer/parts" },
    },
  ].filter(Boolean).filter((a) => !dismissed.includes(a.id));

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
            className={`flex items-start gap-4 p-4 rounded-xl border-l-4 ${
              alert.type === "warning"
                ? "bg-amber-50 dark:bg-amber-900/15 border-l-amber-500 border border-amber-200/50 dark:border-amber-700/30"
                : "bg-blue-50 dark:bg-blue-900/15 border-l-secondary border border-secondary/20 dark:border-secondary/20"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              alert.type === "warning" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" : "bg-secondary/10 text-secondary"
            }`}>
              <Icon name={alert.icon} className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${alert.type === "warning" ? "text-amber-800 dark:text-amber-300" : "text-secondary"}`}>
                {alert.title}
              </p>
              <p className={`text-xs mt-0.5 ${alert.type === "warning" ? "text-amber-700 dark:text-amber-400" : "text-on-surface-variant dark:text-neutral-400"}`}>
                {alert.message}
              </p>
              <a href={alert.action.href} className={`text-xs font-bold underline underline-offset-2 mt-1 inline-block ${
                alert.type === "warning" ? "text-amber-700 dark:text-amber-400" : "text-secondary"
              }`}>
                {alert.action.label} →
              </a>
            </div>
            <button onClick={() => setDismissed((d) => [...d, alert.id])} className="text-on-surface-variant hover:text-on-surface p-1 shrink-0">
              <Icon name="close" className="text-sm" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function LoyaltyProgram() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loyaltyApi, setLoyaltyApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loyaltyData, ordersData, ledger] = await Promise.all([
          api.getCustomerLoyalty().catch(() => null),
          api.getOrderHistory().catch(() => []),
          api.getCustomerLedger().catch(() => ({ pendingInvoices: [], totalOutstandingBalance: 0 })),
        ]);
        if (!cancelled) {
          setOrders(Array.isArray(ordersData) ? ordersData : []);
          setInvoices(ledger?.pendingInvoices || []);
          if (loyaltyData) setLoyaltyApi(loyaltyData);
        }
      } catch {
        if (!cancelled) toast("Could not load loyalty data", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ─── derived data (prefer backend loyalty API values) ─────────── */
  const { totalSpent, singleOrderMax, recentOrders } = useMemo(() => {
    const clientTotal  = orders.reduce((s, o) => s + parseMoney(o.totalAmount || o.amount || 0), 0);
    const clientMax    = orders.reduce((m, o) => Math.max(m, parseMoney(o.totalAmount || o.amount || 0)), 0);
    return {
      totalSpent:     loyaltyApi?.totalSpent         ?? clientTotal,
      singleOrderMax: loyaltyApi?.maxSingleOrderAmount ?? clientMax,
      recentOrders:   orders.slice(0, 10),
    };
  }, [orders, loyaltyApi]);

  const discountEligible = loyaltyApi?.discountEligible ?? singleOrderMax >= 5000;
  const tier = getTier(totalSpent);
  const nextTier = getNextTier(totalSpent);

  // Overdue credit: any invoice older than 30 days
  const overdueCredit = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return invoices.some((inv) => {
      const d = new Date(inv.issueDate || inv.dueDate || "");
      return !isNaN(d) && d < cutoff;
    });
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Icon name="sync" className="text-3xl text-secondary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <motion.header
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface dark:text-white font-headline flex items-center gap-3">
            <Icon name="workspace_premium" filled className="text-yellow-500 text-4xl" />
            Loyalty Program
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-400 mt-1 font-medium">
            Earn rewards with every purchase. 10% discount on orders ≥ Rs. 5,000.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} size="lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-neutral-500">Current Tier</p>
            <p className={`text-2xl font-extrabold font-headline ${tier.text}`}>{tier.name}</p>
          </div>
        </div>
      </motion.header>

      {/* System Alerts */}
      <SystemAlerts overdueCredit={overdueCredit} hasLowStock={false} />

      {/* Discount Status */}
      <DiscountBanner eligible={discountEligible} singleOrderMax={singleOrderMax} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Spent", value: fmtNPR(totalSpent), icon: "payments", color: "text-secondary" },
          { label: "Orders Placed", value: orders.length, icon: "shopping_bag", color: "text-blue-500" },
          { label: "Best Single Order", value: fmtNPR(singleOrderMax), icon: "trending_up", color: "text-emerald-500" },
          {
            label: "Discount Status",
            value: discountEligible ? "Active ✓" : "Locked",
            icon: discountEligible ? "local_offer" : "lock",
            color: discountEligible ? "text-emerald-500" : "text-on-surface-variant",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-5 border border-surface-container dark:border-neutral-800/50 shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className={`${stat.color} mb-2`}><Icon name={stat.icon} filled /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-neutral-500">{stat.label}</p>
            <p className="text-xl font-extrabold font-headline text-on-surface dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tier Progress */}
      <motion.div
        className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-6 border border-surface-container dark:border-neutral-800/50 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-headline font-bold text-xl text-on-surface dark:text-white mb-6 flex items-center gap-2">
          <Icon name="stacked_bar_chart" className="text-secondary" /> Tier Progress
        </h2>
        <SpendProgress totalSpent={totalSpent} tier={tier} nextTier={nextTier} />

        {/* All tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {TIERS.map((t) => {
            const active = t.name === tier.name;
            return (
              <div
                key={t.name}
                className={`rounded-xl p-4 border-2 transition-all ${active ? `${t.bg} ${t.border} shadow-md` : "border-transparent bg-surface-container-low dark:bg-neutral-800/50 opacity-60"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <TierBadge tier={t} />
                  <div>
                    <p className={`font-bold text-sm ${active ? t.text : "text-on-surface dark:text-neutral-300"}`}>{t.name}</p>
                    <p className="text-[10px] text-on-surface-variant dark:text-neutral-500 uppercase tracking-wider">
                      {t.maxSpend === Infinity ? `≥ ${fmtNPR(t.minSpend)}` : `${fmtNPR(t.minSpend)} – ${fmtNPR(t.maxSpend)}`}
                    </p>
                  </div>
                  {active && <span className="ml-auto text-[10px] font-bold bg-secondary text-on-secondary rounded-full px-2 py-0.5">YOU</span>}
                </div>
                <ul className="space-y-1">
                  {t.perks.map((perk) => (
                    <li key={perk} className="text-xs text-on-surface-variant dark:text-neutral-400 flex items-start gap-1.5">
                      <Icon name="check_circle" className="text-xs text-emerald-500 mt-0.5 shrink-0" /> {perk}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Orders (spend history) */}
      {recentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <h2 className="font-headline font-bold text-xl text-on-surface dark:text-white mb-4 flex items-center justify-between">
             Purchase History
             <span className="text-xs font-normal text-on-surface-variant">Showing last 10 orders</span>
          </h2>
          <div className="space-y-3">
            {recentOrders.map((order, idx) => {
              const amount = parseMoney(order.totalAmount || order.amount || 0);
              const eligible = amount >= 5000;
              return (
                <motion.div
                  key={order.orderNumber || idx}
                  className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-4 flex items-center gap-4 border border-surface-container dark:border-neutral-800/50 group cursor-pointer hover:bg-surface-container-low transition-all"
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${eligible ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-surface-container-high dark:bg-neutral-800 text-on-surface-variant"}`}>
                    <Icon name={eligible ? "local_offer" : "receipt"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface dark:text-white truncate">
                      {order.itemsSummary || order.description || `Order #${order.orderNumber || idx + 1}`}
                    </p>
                    <p className="text-xs text-on-surface-variant dark:text-neutral-500">
                      {order.orderDate ? formatDate(order.orderDate) : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold font-headline text-on-surface dark:text-white">{fmtNPR(amount)}</p>
                    <div className="flex items-center gap-2 mt-1">
                       {eligible && (
                         <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                           10% Applied
                         </span>
                       )}
                       <span className="text-[10px] uppercase font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">Details →</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-surface-container dark:border-neutral-800/50 flex justify-between items-center bg-stone-50 dark:bg-neutral-900/50">
                <div>
                  <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">Purchase Insights</h3>
                  <p className="text-sm text-secondary font-bold">{selectedOrder.orderNumber}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-surface-container rounded-full transition-all">
                  <Icon name="close" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-surface-container rounded-xl">
                       <span className="text-[10px] font-bold text-outline block mb-1">DATE</span>
                       <span className="font-bold text-sm">{formatDate(selectedOrder.orderDate)}</span>
                    </div>
                    <div className="p-3 bg-surface-container rounded-xl text-right">
                       <span className="text-[10px] font-bold text-outline block mb-1">TOTAL</span>
                       <span className="font-bold text-sm text-secondary">{fmtNPR(parseMoney(selectedOrder.totalAmount || selectedOrder.amount || 0))}</span>
                    </div>
                 </div>
                 <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">Order Items</h4>
                 <div className="space-y-2">
                    {selectedOrder.items?.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 border-b border-surface-container dark:border-neutral-800/50 last:border-0">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-secondary">
                                 <Icon name={item.itemType === "service" ? "build" : "precision_manufacturing"} className="text-xs" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{item.description}</p>
                                <p className="text-[10px] text-on-surface-variant uppercase">Qty: {item.quantity} · {fmtNPR(item.unitPrice)} ea</p>
                              </div>
                           </div>
                           <span className="font-bold text-sm">{fmtNPR(item.lineTotal)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant p-4 bg-surface-container rounded-xl italic">No item breakdown available for this invoice.</p>
                    )}
                 </div>
              </div>
              <div className="p-6 bg-surface-container dark:bg-neutral-900/50 border-t border-surface-container dark:border-neutral-800/50 flex justify-end">
                 <Button onClick={() => setSelectedOrder(null)}>Dismiss</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
