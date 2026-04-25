import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition } from "@/components/ui/motion";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";

const vehicleImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCZvy7Xe_tfhvoxNwYTS__GRT5AwO57W1Qi4BbF_pkhr511N3Vwf9TWSNbZFTko9GX_KiO_OWPyysWz-kZHC8dV1JKC7Qe1UMGUjOnARMyV1ltOg1M-JVFvs5aD5YrJaGk9m2HCGqMOK15-psHxeHKVqvgxe8PxBWJOn3nBL3TnRMlwpWcGUM3hSEGpC2p9QGzGzlJoXDqn1bDGKyRWXJgXJqgJt8NaVlXSLhItKEUFhRUp_1-cYU8gmtNwJHCKOp2s-Lm82xKgBw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBtFUKzMjx-pn14rhUJGqm1HYKNkgpuLxwuNJ-L9lpMee5TIlhUFT0hoUz0lIgjc4DPEAVb5vdbX5rWC8DI0fpI6bkQwHP8kdUx98ufcuT1vYRSwiLmxj4T-KDyAquKXabAosk0UyR9DCAUMFwlr4-PY4SupbqRIHjcm2GDNxkfWpBn9QyVhPAKzY2J1ZeeA99BriEo7myi9mtH63cL2xRRFK1TunxLvbyzSp5KfmxTZYf05JzNVt8LgqFCXK6E2PiWFFd3O64u-w",
];

function StatCard({ label, value, delay = 0, className = "" }) {
  return (
    <motion.div
      className={`bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-6 flex flex-col justify-between shadow-sm dark:border dark:border-neutral-800/50 ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-neutral-500 mb-1">{label}</p>
      <h2 className="text-2xl sm:text-3xl font-extrabold font-headline text-on-surface dark:text-neutral-100">{value}</h2>
    </motion.div>
  );
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dashboard, vehicleList] = await Promise.all([
          api.getCustomerDashboard(),
          api.getVehicles().catch(() => []),
        ]);
        if (!cancelled) {
          setData(dashboard);
          setVehicles(Array.isArray(vehicleList) ? vehicleList : []);
          setActivity(Array.isArray(dashboard?.recentActivity) ? dashboard.recentActivity : []);
        }
      } catch {
        if (!cancelled) {
          toast("Could not load dashboard from API", "error");
          setData({});
          setVehicles([]);
          setActivity([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const parseMoney = (value) => Number(String(value ?? "0").replace(/[Rs.\s$,]/g, "")) || 0;

  const pendingPayments = data?.pendingPayments ?? "Rs. 0.00";
  const totalSpent = data?.totalSpent ?? "Rs. 0.00";
  const activeOrders = data?.activeOrders ?? 0;
  const loyaltyPoints = data?.loyaltyPoints ?? 0;
  const pendingValue = parseMoney(pendingPayments);

  const loyaltyEligible = useMemo(() => {
    const maxSingleOrder = activity
      .filter((a) => a.type === "Order")
      .reduce((max, item) => Math.max(max, parseMoney(item.amount)), 0);
    return maxSingleOrder > 5000;
  }, [activity]);

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
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <header className="mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            Welcome back, {user?.fullName || user?.name || "Customer"}.
          </h1>
          <p className="text-on-surface-variant font-medium">
            System status: booking, service tracking, and reminders are active.
          </p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Spent" value={totalSpent} delay={0} />
          <StatCard label="Active Orders" value={activeOrders} delay={0.04} />
          <StatCard label="Loyalty Points" value={loyaltyPoints.toLocaleString()} delay={0.08} />
          <motion.div
            className="bg-tertiary-container dark:bg-[#1C1C1C] rounded-xl p-6 flex flex-col justify-between shadow-sm dark:border dark:border-neutral-800/50"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <p className="text-xs font-bold text-on-tertiary-container dark:text-neutral-400 text-on-tertiary-container uppercase tracking-widest mb-1">
              Pending Payments
            </p>
            <h2 className="text-2xl font-extrabold font-headline text-on-tertiary-container dark:text-neutral-100">
              {pendingPayments}
            </h2>
            <Button
              variant="default"
              className="mt-3 w-full dark:bg-primary dark:text-on-primary bg-on-tertiary-container text-tertiary-container hover:bg-on-tertiary-container/90 text-xs shadow-sm"
              onClick={() => navigate("/customer/payments")}
            >
              Pay Invoice
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AI Health Alerts */}
          <motion.div
            className="md:col-span-12 lg:col-span-6 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 shadow-sm ring-1 ring-surface-container"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-bold text-xl flex items-center gap-2">
                <Icon name="analytics" className="text-secondary" />
                AI Health Alerts
              </h3>
              <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase">
                Active Monitoring
              </span>
            </div>
            <div className="space-y-4">
              {vehicles.length > 0 ? (
                vehicles.slice(0, 2).map((v, i) => (
                  <div key={v.id || i} className={`flex items-center gap-4 p-3 rounded-lg ${i === 0 ? "bg-tertiary-fixed dark:bg-[#1C1C1C] dark:border dark:border-neutral-800" : "bg-secondary-fixed dark:bg-[#1C1C1C] dark:border dark:border-neutral-800"}`}>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${i === 0 ? "text-tertiary dark:text-neutral-300 dark:bg-neutral-800 bg-white" : "text-secondary dark:text-neutral-300 dark:bg-neutral-800 bg-white"}`}>
                      <Icon name={i === 0 ? "slow_motion_video" : "tire_repair"} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold ${i === 0 ? "text-on-tertiary-fixed dark:text-neutral-200" : "text-on-secondary-fixed dark:text-neutral-200"}`}>
                        {i === 0 ? "Brake Pad Wear" : "Tire Pressure Optimization"}
                      </h4>
                      <p className={`text-xs ${i === 0 ? "text-on-tertiary-fixed-variant dark:text-neutral-500" : "text-on-secondary-fixed-variant dark:text-neutral-500"}`}>
                        {v.nickname || v.name || "Vehicle"}: {v.healthScore >= 90 ? "All systems nominal" : "maintenance recommended"}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${v.healthScore < 70 ? "text-error dark:text-red-400" : "text-secondary dark:text-neutral-400"}`}>
                      {v.healthScore >= 90 ? "Good" : v.healthScore >= 70 ? "Minor" : "Critical"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-on-surface-variant dark:text-neutral-500">
                  <Icon name="directions_car" className="text-4xl mb-2" />
                  <p className="text-sm">No vehicles registered. Add one in your profile.</p>
                  <Button variant="outline" className="mt-4 dark:border-neutral-700 dark:text-neutral-300" onClick={() => navigate("/customer/profile")}>
                    <Icon name="add" className="text-sm" /> Add Vehicle
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Managed Vehicles */}
          <div className="md:col-span-12 lg:col-span-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-headline font-bold text-xl dark:text-neutral-100">Managed Vehicles</h3>
              <Link
                to="/customer/profile"
                className="text-sm font-bold text-secondary flex items-center gap-1 hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
              >
                View Garage <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
            {vehicles.length === 0 ? (
              <div className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-8 text-center text-on-surface-variant dark:text-neutral-500 shadow-sm dark:border dark:border-neutral-800/50">
                <Icon name="garage" className="text-4xl mb-2" />
                <p className="text-sm">No vehicles in your garage yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.slice(0, 2).map((vehicle, idx) => (
                  <motion.div
                    key={vehicle.id || idx}
                    className="group bg-surface-container-low dark:bg-[#1C1C1C] rounded-2xl overflow-hidden shadow-sm dark:border dark:border-neutral-800 hover:bg-surface-container-high dark:hover:bg-neutral-800/80 transition-all duration-300"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + idx * 0.08 }}
                  >
                    <div className="h-36 overflow-hidden">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        src={vehicleImages[idx % vehicleImages.length]}
                        alt={vehicle.nickname || "Vehicle"}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-headline font-extrabold text-base dark:text-neutral-200">{vehicle.nickname || vehicle.name || "My Vehicle"}</h4>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${(vehicle.healthScore || 100) >= 90 ? "bg-on-secondary-container dark:bg-emerald-900/40 text-white dark:text-emerald-400" : "bg-tertiary-container dark:bg-red-900/40 text-on-tertiary-container dark:text-red-400"}`}>
                          {(vehicle.healthScore || 100) >= 90 ? "OPTIMAL" : "SERVICE DUE"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/50 dark:bg-neutral-800 p-2 rounded-lg">
                          <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-neutral-500 mb-1">Mileage</p>
                          <p className="text-sm font-bold dark:text-neutral-300">{vehicle.mileageKm ?? "—"} km</p>
                        </div>
                        <div className="bg-white/50 dark:bg-neutral-800 p-2 rounded-lg">
                          <p className="text-[10px] uppercase font-bold text-on-surface-variant dark:text-neutral-500 mb-1">Health</p>
                          <p className={`text-sm font-bold ${(vehicle.healthScore || 100) >= 90 ? "text-emerald-600 dark:text-emerald-400" : (vehicle.healthScore || 100) >= 70 ? "text-amber-600 dark:text-amber-400" : "text-error dark:text-red-400"}`}>
                            {vehicle.healthScore || 100} <span className="font-medium text-[10px] text-on-surface-variant dark:text-neutral-500">/ 100</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <motion.div
            className="md:col-span-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 shadow-sm border border-surface-container dark:border-neutral-800/50">
              <h3 className="font-headline font-bold text-xl mb-6 dark:text-neutral-100">Recent Activity</h3>
              {activity.length === 0 ? (
                <p className="text-center text-on-surface-variant dark:text-neutral-500 py-6 text-sm">No recent activity yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.slice(0, 6).map((item, index) => (
                    <div key={item.id || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${index === 0 ? "bg-secondary dark:bg-emerald-500" : "bg-surface-container-highest dark:bg-neutral-700"}`} />
                      </div>
                      <div className="flex-1 pb-4 border-b border-surface-container dark:border-neutral-800 last:border-0">
                        <p className="text-xs font-bold text-on-surface-variant dark:text-neutral-500 uppercase mb-1">{item.date}</p>
                        <h5 className="text-sm font-bold text-on-surface dark:text-neutral-200">
                          {item.type === "Order" ? "Parts Purchase" : "Service Update"}
                        </h5>
                        <p className="text-xs text-on-surface-variant dark:text-neutral-400">
                          {item.description} {item.amount ? `— ${item.amount}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to="/customer/orders"
                className="mt-4 block text-center text-xs font-bold text-secondary dark:text-neutral-400 uppercase tracking-widest py-3 border-t border-surface-container dark:border-neutral-800 hover:bg-surface-container-low dark:hover:bg-neutral-800/50 transition-all rounded-b-xl"
              >
                View Full History
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Loyalty Banner */}
        <div className="rounded-xl border border-secondary/20 dark:border-emerald-900/50 bg-secondary/5 dark:bg-emerald-900/10 p-4">
          <p className="text-sm text-on-surface-variant dark:text-neutral-300">
            <span className="font-semibold text-secondary dark:text-emerald-400">Loyalty Program:</span>{" "}
            {loyaltyPoints > 0
              ? `You have ${loyaltyPoints.toLocaleString()} points accumulated. Keep ordering to unlock rewards.`
              : "Earn points on every purchase and service. 10% discount unlocks at 5,000 points."}
            {loyaltyEligible ? " You currently qualify based on recent activity." : ""}
          </p>
        </div>
      </div>

      {/* FAB */}
      <motion.button
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/customer/booking")}
        aria-label="Open booking"
      >
        <Icon name="add" filled />
      </motion.button>
    </PageTransition>
  );
}