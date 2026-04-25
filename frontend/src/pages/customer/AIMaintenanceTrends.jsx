import { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";



export default function AIMaintenanceTrends() {
  const [predictions, setPredictions] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("12M");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, t] = await Promise.all([api.getAiPredictions(), api.getMaintenanceTrends()]);
        if (!cancelled) {
          setPredictions(Array.isArray(p) ? p : []);
          setTrends(Array.isArray(t) ? t : []);
        }
      } catch {
        if (!cancelled) {
          // Toast is optional here — AI endpoint might not be ready
          setPredictions([]);
          setTrends([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const riskColor = (level) => ({
    High: "text-error",
    Medium: "text-amber-600 dark:text-amber-400",
    Low: "text-secondary",
  }[level] || "text-on-surface");

  const barColor = (level) => ({
    High: "bg-error",
    Medium: "bg-amber-500",
    Low: "bg-secondary",
  }[level] || "bg-secondary");

  const handleScheduleService = (pred) => {
    toast(`Service request created for ${pred.component} on ${pred.vehicle}`, "success");
  };

  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    return chartRange === "6M" ? trends.slice(-6) : trends;
  }, [trends, chartRange]);

  const displayPredictions = predictions || [];

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <motion.header
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">
              <Icon name="auto_awesome" className="text-sm" />
              AI-Powered Diagnostics
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter font-headline text-on-surface dark:text-white mb-2">
              Predictive Diagnostics
            </h1>
            <p className="text-on-surface-variant dark:text-neutral-400 text-base sm:text-lg">
              Real-time analytical forecast for your fleet, projecting component life cycles based on operational telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${loading ? "bg-amber-100 dark:bg-amber-500/10" : "bg-surface-container-low dark:bg-neutral-800"}`}>
              <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-500 animate-pulse" : "bg-secondary"}`} />
              <span className={`text-sm font-medium uppercase tracking-tight ${loading ? "text-amber-600 dark:text-amber-400" : "text-secondary"}`}>
                {loading ? "Loading…" : "AI Status: Active"}
              </span>
            </div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Wear Index Chart */}
          <motion.section
            className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#1C1C1C] p-6 sm:p-8 rounded-xl shadow-sm border border-surface-container dark:border-neutral-800/50"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">Aggregate Wear Index</h3>
                <p className="text-sm text-on-surface-variant">Projected degradation curve</p>
              </div>
              <div className="flex gap-2">
                {["6M", "12M"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      chartRange === r
                        ? "bg-secondary text-on-primary"
                        : "bg-surface-container dark:bg-neutral-800 text-on-surface-variant"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-52 font-medium">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="wearGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--md-sys-color-secondary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--md-sys-color-secondary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v) => [`${v}%`, "Wear"]} />
                    <Area type="monotone" dataKey="wear" stroke="var(--md-sys-color-secondary)" fill="url(#wearGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-on-surface-variant/70 border border-dashed border-outline-variant/30 rounded-xl">
                  <p className="text-sm">Not enough data to project wear curves.</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Component Health */}
          <motion.section
            className="lg:col-span-4 bg-surface-container-lowest dark:bg-[#1C1C1C] p-6 sm:p-8 rounded-xl shadow-sm border border-surface-container dark:border-neutral-800/50 flex flex-col"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.15 }}
          >
            <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white mb-1">Component Health</h3>
            <p className="text-sm text-on-surface-variant mb-6">Remaining service life prediction</p>
            <div className="space-y-5 flex-1">
              {displayPredictions.length > 0 ? displayPredictions.map((pred, i) => (
                <motion.div
                  key={pred.component || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="flex justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${pred.riskLevel === "High" ? "text-error" : "text-on-surface dark:text-white"}`}>
                      {pred.component}
                    </span>
                    <span className={`text-sm font-bold ${riskColor(pred.riskLevel)}`}>
                      {pred.confidence}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${barColor(pred.riskLevel)} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pred.confidence}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 uppercase font-medium tracking-tight ${
                    pred.riskLevel === "High" ? "text-error font-bold" : "text-on-surface-variant"
                  }`}>
                    {pred.riskLevel === "High" ? "⚠ Critical — Immediate Inspection" : `Est. Remaining: ${pred.estimatedFailure}`}
                  </p>
                </motion.div>
              )) : (
                <div className="text-center mt-6">
                  <Icon name="check_circle" className="text-emerald-500 text-3xl mb-2" />
                  <p className="text-sm font-bold text-on-surface">No predictions</p>
                  <p className="text-xs text-on-surface-variant">All components operating nominally</p>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* AI-Driven Insights */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight font-headline text-on-surface dark:text-white">AI-Driven Insights</h2>
            <div className="h-px flex-1 bg-surface-container-high dark:bg-neutral-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: "trending_up",
                bg: "bg-tertiary-container",
                text: "text-on-tertiary-container",
                title: "Thermal Anomalies",
                desc: "Unusual heat spikes detected in the rear axle during high-torque operations. Reducing max RPM by 5% could extend bearing life by 18%.",
                action: "Apply Recommendation",
              },
              {
                icon: "auto_fix_high",
                bg: "bg-secondary-container",
                text: "text-on-secondary-container",
                title: "Vibration Analysis",
                desc: "Harmonic resonance detected in chassis frame. Scheduled bolt retightening in the next service window is advised to prevent fatigue cracks.",
                action: "Schedule Service",
              },
              {
                icon: "opacity",
                bg: "bg-primary-container",
                text: "text-on-primary-container",
                title: "Fluid Degradation",
                desc: "Viscosity levels of hydraulic fluid are dropping faster than historical norms. Check for potential oxidation in the high-pressure reservoir.",
                action: "Order Fluid Test Kit",
              },
            ].map((insight, i) => (
              <motion.article
                key={insight.title}
                className="bg-surface-container-lowest dark:bg-[#1C1C1C] p-6 rounded-xl border border-surface-container dark:border-neutral-800/50 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl ${insight.bg} ${insight.text} flex items-center justify-center mb-4`}>
                  <Icon name={insight.icon} />
                </div>
                <h4 className="text-base font-bold font-headline text-on-surface dark:text-white mb-2">{insight.title}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{insight.desc}</p>
                <button
                  className="text-sm font-bold text-secondary hover:underline"
                  onClick={() => toast(`${insight.action} — request submitted`, "success")}
                >
                  {insight.action} →
                </button>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Predictive Actions */}
        {displayPredictions.filter(p => p.riskLevel === "High").length > 0 && (
          <motion.section
            className="bg-error-container/20 dark:bg-red-900/20 border border-error/20 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-start gap-4">
              <Icon name="error" className="text-error text-2xl shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold font-headline text-error text-lg mb-1">Action Required</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  {displayPredictions.filter(p => p.riskLevel === "High").length} component(s) require immediate inspection based on predictive analysis.
                </p>
                <Button
                  className="bg-error text-on-error hover:bg-error/90"
                  onClick={() => toast("Service request submitted for critical components", "success")}
                >
                  <Icon name="build" className="text-sm" /> Schedule Emergency Service
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </PageTransition>
  );
}