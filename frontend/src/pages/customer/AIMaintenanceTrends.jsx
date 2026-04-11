import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";

export default function AIMaintenanceTrends() {
  const [predictions, setPredictions] = useState([]);
  const [trends, setTrends] = useState([]);
  const [chartRange, setChartRange] = useState("12M");
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.getAiPredictions(), api.getMaintenanceTrends()])
      .then(([p, t]) => {
        setPredictions(Array.isArray(p) ? p : []);
        setTrends(Array.isArray(t) ? t : []);
      })
      .catch(() => {
        toast("Could not load AI data from API", "error");
        setPredictions([]);
        setTrends([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const riskColor = (level) =>
    ({
      High: "text-error",
      Medium: "text-on-surface",
      Low: "text-secondary",
    }[level] || "text-on-surface");

  const barColor = (level) =>
    ({
      High: "bg-error",
      Medium: "bg-primary-dim",
      Low: "bg-secondary",
    }[level] || "bg-secondary");

  const handleScheduleService = (pred) => {
    toast(`Service scheduled for ${pred.component} on ${pred.vehicle}`, "success");
  };

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter font-headline text-on-surface dark:text-white mb-2">
              Predictive Diagnostics
            </h1>
            <p className="text-on-surface-variant dark:text-stone-400 text-lg">
              Real-time analytical forecast for your fleet. Machine learning models projecting component life cycles based on operational telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-surface-container-low dark:bg-stone-800 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-sm font-medium text-secondary uppercase tracking-tight">AI Status: Active</span>
            </div>
          </div>
        </motion.header>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Aggregate Wear Index */}
          <motion.section
            className="lg:col-span-8 bg-surface-container-lowest dark:bg-stone-900 p-8 rounded-xl shadow-sm relative overflow-hidden group"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white">Aggregate Wear Index</h3>
                <p className="text-sm text-on-surface-variant">Projected 12-month degradation curve</p>
              </div>
              <div className="flex gap-2">
                {["6M", "12M"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                      chartRange === r
                        ? "bg-primary dark:bg-secondary text-on-primary"
                        : "bg-surface-container dark:bg-stone-800 text-on-surface-variant"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="h-64 w-full relative mt-4">
              <svg className="w-full h-full" viewBox="0 0 800 200">
                <line stroke="currentColor" strokeDasharray="4" className="text-surface-container" x1="0" x2="800" y1="50" y2="50" />
                <line stroke="currentColor" strokeDasharray="4" className="text-surface-container" x1="0" x2="800" y1="100" y2="100" />
                <line stroke="currentColor" strokeDasharray="4" className="text-surface-container" x1="0" x2="800" y1="150" y2="150" />
                <path className="text-secondary/5" d="M0,30 Q200,35 400,70 T800,150 L800,170 T400,90 Q200,55 0,50 Z" fill="currentColor" />
                <path className="text-secondary" d="M0,40 Q200,45 400,80 T800,160" fill="none" stroke="currentColor" strokeWidth="4" />
                <circle cx="400" cy="80" r="6" fill="#4d6172" />
                <text className="text-[10px] font-bold fill-on-surface" x="415" y="75">Current Threshold (82%)</text>
              </svg>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">
                <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span><span>DEC</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-surface-container-low dark:border-stone-800 pt-6">
              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Health Status</p>
                <p className="text-xl font-extrabold font-headline text-on-surface dark:text-white">Optimal</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Next Downtime</p>
                <p className="text-xl font-extrabold font-headline text-on-surface dark:text-white">24 Days</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider mb-1">Efficiency Loss</p>
                <p className="text-xl font-extrabold font-headline text-error">-0.4%</p>
              </div>
            </div>
          </motion.section>

          {/* Critical Components */}
          <motion.section
            className="lg:col-span-4 bg-surface-container-low dark:bg-stone-900 p-8 rounded-xl flex flex-col"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold font-headline text-on-surface dark:text-white mb-6">Critical Components</h3>
            <div className="space-y-8 flex-1">
              {predictions.length > 0 ? (
                predictions.slice(0, 4).map((pred, i) => (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div className="flex justify-between mb-2">
                      <span className={`text-sm font-semibold ${pred.riskLevel === "High" ? "text-error" : "text-on-surface dark:text-white"}`}>
                        {pred.component}
                      </span>
                      <span className={`text-sm font-bold ${riskColor(pred.riskLevel)}`}>
                        {pred.confidence}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container dark:bg-stone-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${barColor(pred.riskLevel)} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pred.confidence}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      />
                    </div>
                    <p className={`text-[10px] mt-1.5 uppercase font-medium tracking-tight ${
                      pred.riskLevel === "High" ? "text-error font-bold" : "text-on-surface-variant"
                    }`}>
                      {pred.riskLevel === "High"
                        ? "Critical Warning: Immediate Inspection"
                        : `Est. Failure: ${pred.estimatedFailure}`}
                    </p>
                  </motion.div>
                ))
              ) : (
                [
                  { name: "Transmission Thermal Plate", pct: 88, color: "bg-secondary" },
                  { name: "Hydraulic Pressure Actuator", pct: 42, color: "bg-primary-dim" },
                  { name: "Auxiliary Cooling Fan", pct: 12, color: "bg-error", critical: true },
                  { name: "Primary Drive Shaft", pct: 95, color: "bg-secondary" },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between mb-2">
                      <span className={`text-sm font-semibold ${item.critical ? "text-error" : "text-on-surface dark:text-white"}`}>
                        {item.name}
                      </span>
                      <span className={`text-sm font-bold ${item.critical ? "text-error" : "text-on-surface dark:text-white"}`}>
                        {item.pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container dark:bg-stone-700 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                    <p className={`text-[10px] mt-1.5 uppercase font-medium tracking-tight ${
                      item.critical ? "text-error font-bold" : "text-on-surface-variant"
                    }`}>
                      {item.critical ? "Critical Warning: Immediate Inspection" : `Est. Failure: ${(item.pct * 170).toLocaleString()} Cycles`}
                    </p>
                  </div>
                ))
              )}
            </div>
            <button className="mt-8 w-full py-3 bg-surface-container-highest dark:bg-stone-700 text-on-surface dark:text-white font-bold text-sm rounded-lg hover:bg-surface-variant dark:hover:bg-stone-600 transition-colors">
              View Full Inventory Report
            </button>
          </motion.section>
        </div>

        {/* AI-Driven Insights */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight font-headline text-on-surface dark:text-white">AI-Driven Insights</h2>
            <div className="h-px flex-1 bg-surface-container-high dark:bg-stone-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                desc: "Harmonic resonance detected in chassis frame C-4. Scheduled bolt retightening in the next service window is advised to prevent fatigue cracks.",
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
                className="bg-surface-container-lowest dark:bg-stone-900 p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className={`w-10 h-10 ${insight.bg} ${insight.text} rounded-lg flex items-center justify-center mb-6`}>
                  <Icon name={insight.icon} />
                </div>
                <h4 className="text-lg font-bold font-headline mb-2">{insight.title}</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{insight.desc}</p>
                <button
                  className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest cursor-pointer hover:gap-3 transition-all"
                  onClick={() => toast(`${insight.action} applied`, "success")}
                >
                  {insight.action} <Icon name="arrow_forward" className="text-sm" />
                </button>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Technical Telemetry Log */}
        <motion.section
          className="overflow-hidden rounded-xl bg-surface-container-low dark:bg-stone-900"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <div className="px-8 py-6 bg-surface-container dark:bg-stone-800">
            <h3 className="text-sm font-extrabold font-headline uppercase tracking-widest text-on-surface dark:text-white">
              Technical Telemetry Log
            </h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-surface-container-high/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">
              <tr>
                <th className="px-8 py-4">Sensor ID</th>
                <th className="px-8 py-4">Parameter</th>
                <th className="px-8 py-4">Current Value</th>
                <th className="px-8 py-4">ML Prediction</th>
                <th className="px-8 py-4">Risk Level</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { id: "SYS-TH-009", param: "Core Temperature", val: "84.2°C", pred: "Stable", risk: "LOW", riskColor: "text-green-600" },
                { id: "SYS-PR-112", param: "Line Pressure", val: "12,400 PSI", pred: "Declining (-2%)", risk: "MODERATE", riskColor: "text-amber-600" },
                { id: "SYS-VB-445", param: "Radial Oscillation", val: "0.02 mm", pred: "Stable", risk: "LOW", riskColor: "text-green-600" },
                { id: "SYS-FL-088", param: "Oxidation Level", val: "4.2 ppm", pred: "Rising (+12%)", risk: "HIGH", riskColor: "text-error" },
              ].map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-background dark:bg-stone-950/50" : "bg-surface-container-low dark:bg-stone-900"}>
                  <td className="px-8 py-4 font-semibold text-on-surface dark:text-white">{row.id}</td>
                  <td className="px-8 py-4">{row.param}</td>
                  <td className="px-8 py-4">{row.val}</td>
                  <td className="px-8 py-4">{row.pred}</td>
                  <td className={`px-8 py-4 font-bold ${row.riskColor}`}>{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.section>
      </div>
    </PageTransition>
  );
}
     