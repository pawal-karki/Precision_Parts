import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";

function parseMoney(str) {
  if (typeof str === "number") return str;
  return parseFloat(String(str).replace(/[Rs.,\s]/g, "").replace("$","")) || 0;
}

function fmtNPR(amount) {
  return `Rs. ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentsBalance() {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [activity] = useState([]);

  useEffect(() => {
    api
      .getOrderHistory()
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        const pending = list
          .filter((o) => o.status === "Processing")
          .map((o) => ({
            id: o.id,
            due: o.date,
            desc: o.items,
            amount: parseMoney(o.total),
          }));
        setInvoices(pending);
      })
      .catch(() => {
        toast("Could not load payment data from API", "error");
        setInvoices([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const totalOutstanding = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.amount, 0),
    [invoices]
  );

  const handlePay = (inv) => {
    toast(`Payment initiated for ${inv.id} — ${fmtNPR(inv.amount)}`, "success");
  };

  const handleClearBalance = () => {
    toast("Payment processing initiated for full balance", "success");
  };

  const handleDownloadStatement = () => {
    toast("Statement download started", "success");
  };

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header
          className="flex justify-between items-end"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface dark:text-white">
              Payments &amp; Ledger
            </h1>
            <p className="text-on-surface-variant dark:text-stone-400 mt-2">
              Financial overview and statement management.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-outline">Last Updated</span>
            <p className="font-semibold text-on-surface dark:text-white">Today, 09:42 AM</p>
          </div>
        </motion.header>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Balance Card */}
          <motion.div
            className="col-span-12 lg:col-span-8 bg-surface-container-lowest dark:bg-stone-900 p-8 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="relative z-10">
              <span className="text-sm font-bold text-secondary uppercase tracking-widest">Current Outstanding Balance</span>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-extrabold font-headline text-on-surface dark:text-white">
                  Rs. {Math.floor(totalOutstanding).toLocaleString("en-IN")}
                </span>
                <span className="text-2xl font-semibold font-headline text-outline-variant">
                  .{String(Math.round((totalOutstanding % 1) * 100)).padStart(2, "0")}
                </span>
              </div>

            </div>
            <div className="flex flex-wrap gap-4 mt-8 relative z-10">
              <button
                onClick={handleClearBalance}
                className="px-8 py-4 bg-primary dark:bg-stone-700 text-on-primary dark:text-white font-bold font-headline rounded-lg hover:bg-primary-dim transition-all active:scale-[0.98]"
              >
                Clear Balance
              </button>
              <button
                onClick={handleDownloadStatement}
                className="px-8 py-4 bg-secondary-container text-on-secondary-container font-bold font-headline rounded-lg hover:bg-secondary-fixed transition-all active:scale-[0.98]"
              >
                Download Statement
              </button>
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center translate-x-10">
              <Icon name="account_balance_wallet" className="text-[180px]" filled />
            </div>
          </motion.div>

          {/* Payment Health Score */}
          <motion.div
            className="col-span-12 lg:col-span-4 bg-surface-container-low dark:bg-stone-900 p-8 rounded-xl flex flex-col justify-center items-center text-center"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-6">Payment Health Score</h3>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container-highest dark:text-stone-700" cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" />
                <motion.circle
                  className="text-secondary"
                  cx="80"
                  cy="80"
                  r="70"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="440"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 44 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold font-headline text-on-surface dark:text-white">92</span>
                <span className="text-xs font-bold text-on-surface-variant">EXCELLENT</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-6 px-4">
              Your payment consistency is in the top 5% of our industrial partners.
            </p>
          </motion.div>

          {/* Unpaid Invoices */}
          <motion.div
            className="col-span-12 lg:col-span-7 mt-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-on-surface dark:text-white">Unpaid Invoices</h2>
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold">
                {invoices.length} Pending
              </span>
            </div>
            <div className="space-y-3">
              {invoices.map((inv) => (
                <motion.div
                  key={inv.id}
                  className="bg-surface-container-lowest dark:bg-stone-900 p-5 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-low dark:bg-stone-800 flex items-center justify-center rounded-lg">
                      <Icon name="description" className="text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold font-headline text-on-surface dark:text-white">{inv.id}</h4>
                      <p className="text-xs text-on-surface-variant">Due: {inv.due} &bull; {inv.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold font-headline text-on-surface dark:text-white">
                      {fmtNPR(inv.amount)}
                    </span>
                    <button
                      onClick={() => handlePay(inv)}
                      className="text-sm font-bold text-secondary hover:text-on-surface underline underline-offset-4 decoration-2 decoration-secondary/30"
                    >
                      Pay Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="col-span-12 lg:col-span-5 mt-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-on-surface dark:text-white">Recent Activity</h2>
              <button className="text-xs font-bold text-outline hover:text-on-surface transition-colors">VIEW ALL</button>
            </div>
            <div className="bg-white/40 dark:bg-stone-900 backdrop-blur-sm rounded-xl p-1">
              <div className="space-y-1">
                {activity.length === 0 ? (
                  <p className="p-6 text-sm text-on-surface-variant text-center">No ledger activity from the API yet.</p>
                ) : (
                  activity.map((act) => (
                    <div key={act.id} className="p-4 flex gap-4 items-start border-b border-surface-container dark:border-stone-800 last:border-0">
                      <div className={`${act.bg} ${act.text} w-8 h-8 rounded-full flex items-center justify-center shrink-0`}>
                        <Icon name={act.icon} className="text-sm" filled={act.filled} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-bold text-on-surface dark:text-white">{act.title}</p>
                          <span className="text-xs text-outline">{act.time}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{act.desc}</p>
                        {act.amount && (
                          <span className="text-xs font-bold text-secondary mt-1 block">{act.amount}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Stats */}
        <motion.div
          className="flex flex-wrap gap-8 py-8 border-t border-surface-container dark:border-stone-800"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          {[
            { label: "Total Paid YTD", value: "Rs. 1,42,90,000" },
            { label: "Credit Limit", value: "Rs. 2,50,00,000" },
            { label: "Avg Settlement Time", value: "4.2 Days" },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline">{stat.label}</span>
              <p className="text-2xl font-bold font-headline text-on-surface dark:text-white">{stat.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
           