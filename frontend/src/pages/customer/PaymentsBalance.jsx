import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

function parseMoney(str) {
  if (typeof str === "number") return str;
  return parseFloat(String(str).replace(/[Rs.,\s$]/g, "")) || 0;
}

function fmtNPR(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


export default function PaymentsBalance() {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [activity, setActivity] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated] = useState(new Date());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ledger = await api.getCustomerLedger();
        if (!cancelled && ledger) {
          const pending = (ledger.pendingInvoices || []).map((inv) => ({
            id: inv.invoiceNumber || "N/A",
            realId: inv.id,
            due: formatDate(inv.dueDate || inv.issueDate),
            desc: `Invoice issued on ${formatDate(inv.issueDate)}`,
            amount: Number(inv.balanceDue) || 0,
            status: inv.status || "Unknown"
          }));
          setInvoices(pending);
          setActivity(ledger.recentActivity || []);
          setTotalBalance(Number(ledger.totalOutstandingBalance) || 0);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Ledger load error:", err);
          toast("Could not load financial data. Please try again later.", "error");
          setInvoices([]);
          setActivity([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalOutstanding = totalBalance;

  const handlePay = (inv) => {
    toast(`Payment initiated for ${inv.id} — ${fmtNPR(inv.amount)}`, "success");
  };

  const handleClearBalance = () => {
    toast("Full payment processing initiated", "success");
  };

  const handleDownloadStatement = () => {
    const header = "ID,Description,Due Date,Amount\n";
    const rows = invoices.map(inv => `${inv.id},"${inv.desc}",${inv.due},${inv.amount}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Statement downloaded", "success");
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
        <motion.header
          className="flex flex-col md:flex-row justify-between md:items-end gap-4"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
              Payments &amp; Ledger
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-400 mt-2">
              Financial overview and statement management.
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-outline">Last Updated</span>
            <p className="font-semibold text-on-surface dark:text-white">
              {lastUpdated.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </motion.header>

        {/* Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div
            className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#1C1C1C] p-6 sm:p-8 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[260px] border border-surface-container dark:border-neutral-800/50"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-20 -mt-20 pointer-events-none" />
            <div className="relative z-10">
              <span className="text-sm font-bold text-secondary uppercase tracking-widest">Current Outstanding Balance</span>
              <div className="flex items-baseline gap-2 mt-4 flex-wrap">
                <span className="text-4xl sm:text-5xl font-extrabold font-headline text-on-surface dark:text-white">
                  Rs. {Math.floor(totalOutstanding).toLocaleString("en-IN")}
                </span>
                <span className="text-2xl font-semibold font-headline text-outline-variant">
                  .{String((totalOutstanding % 1).toFixed(2)).slice(2)}
                </span>
              </div>
              <div className="flex gap-3 flex-wrap mt-6">
                <button
                  onClick={handleClearBalance}
                  disabled={totalOutstanding === 0}
                  className="px-5 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {totalOutstanding === 0 ? "No Balance Due" : "Clear Full Balance"}
                </button>
                <button
                  onClick={handleDownloadStatement}
                  className="px-5 py-2 border border-outline-variant/30 dark:border-neutral-700/50 rounded-lg text-sm font-bold hover:bg-surface-container dark:hover:bg-neutral-800 transition-colors"
                >
                  Download Statement
                </button>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-surface-container dark:border-neutral-800/50 relative z-10">
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Invoices Pending</span>
                  <p className="text-xl font-bold font-headline text-on-surface dark:text-white">{invoices.length}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Due This Month</span>
                  <p className="text-xl font-bold font-headline text-on-surface dark:text-white">{fmtNPR(totalBalance)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Credit Score */}
          <motion.div
            className="lg:col-span-4 bg-surface-container-lowest dark:bg-[#1C1C1C] p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center shadow-sm border border-surface-container dark:border-neutral-800/50 min-h-[200px]"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Payment Score</span>
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--md-sys-color-surface-container)" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="var(--md-sys-color-secondary)" strokeWidth="12"
                  strokeLinecap="round" strokeDasharray="314"
                  strokeDashoffset={314 - (314 * 0.92)}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-headline text-on-surface dark:text-white">92</span>
                <span className="text-xs font-bold text-on-surface-variant">EXCELLENT</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-4 text-center px-2">
              Your payment consistency is in the top 5% of our partners.
            </p>
          </motion.div>
        </div>

        {/* Unpaid Invoices + Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Unpaid Invoices */}
          <motion.div
            className="lg:col-span-7"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xl font-bold text-on-surface dark:text-white">Unpaid Invoices</h2>
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold">
                {invoices.length} Pending
              </span>
            </div>
            <div className="space-y-3">
              {invoices.length === 0 ? (
                <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-10 text-center text-on-surface-variant border border-surface-container dark:border-neutral-800/50">
                  <Icon name="check_circle" className="text-5xl text-emerald-500 mb-3" />
                  <p className="font-semibold">No outstanding invoices</p>
                  <p className="text-sm mt-1">You're all caught up — great work!</p>
                </div>
              ) : (
                invoices.map((inv) => (
                  <motion.div
                    key={inv.id}
                    className="bg-surface-container-lowest dark:bg-[#1C1C1C] p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow border border-surface-container dark:border-neutral-800/50"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-container-low dark:bg-neutral-800 flex items-center justify-center rounded-lg shrink-0">
                        <Icon name="description" className="text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-bold font-headline text-on-surface dark:text-white">{inv.id}</h4>
                        <p className="text-xs text-on-surface-variant">Due: {inv.due} · {inv.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <span className="font-bold font-headline text-on-surface dark:text-white">{fmtNPR(inv.amount)}</span>
                      <button
                        onClick={() => handlePay(inv)}
                        className="text-sm font-bold text-secondary hover:text-on-surface underline underline-offset-4 decoration-2 decoration-secondary/30 whitespace-nowrap"
                      >
                        Pay Now
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="lg:col-span-5"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-headline text-xl font-bold text-on-surface dark:text-white mb-5">Recent Activity</h2>
            <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl border border-surface-container dark:border-neutral-800/50 overflow-hidden">
              {activity.length === 0 ? (
                <p className="p-6 text-sm text-on-surface-variant text-center">No ledger activity yet.</p>
              ) : (
                <div className="divide-y divide-surface-container dark:divide-neutral-800/50">
                  {activity.map((act) => (
                    <div key={act.id} className="p-4 flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <Icon name={act.icon || "payments"} className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <p className="text-sm font-bold text-on-surface dark:text-white truncate">{act.title || act.description}</p>
                          <span className="text-xs text-outline whitespace-nowrap">{act.time || act.date}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{act.desc || act.description}</p>
                        {act.amount && (
                          <span className="text-xs font-bold text-secondary mt-1 block">{act.amount}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer Stats */}
        <motion.div
          className="flex flex-wrap gap-6 sm:gap-8 py-6 sm:py-8 border-t border-surface-container dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          {[
            { label: "Credit Limit", value: "Rs. 2,50,00,000" },
            { label: "Avg Settlement Time", value: "4.2 Days" },
            { label: "Account Status", value: "Active" },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">{stat.label}</span>
              <p className="text-xl sm:text-2xl font-bold font-headline text-on-surface dark:text-white">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}