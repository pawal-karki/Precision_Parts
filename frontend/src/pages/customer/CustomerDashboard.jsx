import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { motion, PageTransition } from "@/components/ui/motion";

const emptyDashboard = {
  totalSpent: "Rs. 0.00",
  pendingPayments: "Rs. 0.00",
  activeOrders: 0,
  loyaltyPoints: 0,
  vehicles: [],
  recentActivity: [],
};

const vehicleImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCZvy7Xe_tfhvoxNwYTS__GRT5AwO57W1Qi4BbF_pkhr511N3Vwf9TWSNbZFTko9GX_KiO_OWPyysWz-kZHC8dV1JKC7Qe1UMGUjOnARMyV1ltOg1M-JVFvs5aD5YrJaGk9m2HCGqMOK15-psHxeHKVqvgxe8PxBWJOn3nBL3TnRMlwpWcGUM3hSEGpC2p9QGzGzlJoXDqn1bDGKyRWXJgXJqgJt8NaVlXSLhItKEUFhRUp_1-cYU8gmtNwJHCKOp2s-Lm82xKgBw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBtFUKzMjx-pn14rhUJGqm1HYKNkgpuLxwuNJ-L9lpMee5TIlhUFT0hoUz0lIgjc4DPEAVb5vdbX5rWC8DI0fpI6bkQwHP8kdUx98ufcuT1vYRSwiLmxj4T-KDyAquKXabAosk0UyR9DCAUMFwlr4-PY4SupbqRIHjcm2GDNxkfWpBn9QyVhPAKzY2J1ZeeA99BriEo7myi9mtH63cL2xRRFK1TunxLvbyzSp5KfmxTZYf05JzNVt8LgqFCXK6E2PiWFFd3O64u-w",
];

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getCustomerDashboard()
      .then(setData)
      .catch(() => {
        toast("Could not load dashboard from API", "error");
        setData(emptyDashboard);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const parseMoney = (value) => Number(String(value).replace(/[Rs.\s$,]/g, "")) || 0;
  const activity = data?.recentActivity ?? [];
  const vehicles = data?.vehicles ?? [];

  const pendingPayments = data?.pendingPayments ?? "$0.00";
  const totalSpent = data?.totalSpent ?? "$0.00";
  const pendingValue = parseMoney(pendingPayments);

  const loyaltyEligible = useMemo(() => {
    const maxSingleOrder = activity
      .filter((a) => a.type === "Order")
      .reduce((max, item) => Math.max(max, parseMoney(item.amount)), 0);
    return maxSingleOrder > 5000;
  }, [activity]);

  if (!data) {
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
      <div className="space-y-8">
        <header className="mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
            Welcome back, Elena.
          </h1>
          <p className="text-on-surface-variant font-medium">
            System status: booking, service tracking, and reminders are active.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div
            className="md:col-span-4 lg:col-span-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-surface-container-low rounded-xl p-6 h-full flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-on-secondary-fixed-variant uppercase tracking-widest mb-1">
                  Total Spent
                </p>
                <h2 className="text-3xl font-extrabold font-headline text-on-surface">{totalSpent}</h2>
              </div>
              <div className="mt-4 flex items-center gap-2 text-secondary font-semibold text-sm">
                <Icon name="trending_up" className="text-sm" />
                <span>4.2% from last month</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="md:col-span-4 lg:col-span-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            <div className="bg-tertiary-container rounded-xl p-6 h-full flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-on-tertiary-container uppercase tracking-widest mb-1">
                  Pending Payments
                </p>
                <h2 className="text-3xl font-extrabold font-headline text-on-tertiary-container">
                  {pendingPayments}
                </h2>
              </div>
              <Button
                variant="surface"
                className="mt-4 w-full bg-white/60 hover:bg-white text-on-tertiary-container border border-white/20"
                onClick={() =>
                  toast(
                    pendingValue > 0 ? "Opening pending payment invoices..." : "No pending payments right now.",
                    pendingValue > 0 ? "info" : "success"
                  )
                }
              >
                Pay Invoice
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="md:col-span-4 lg:col-span-6 bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-surface-container"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
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
              <div className="flex items-center gap-4 p-3 bg-tertiary-fixed rounded-lg">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-tertiary">
                  <Icon name="slow_motion_video" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-tertiary-fixed">Brake Pad Wear</h4>
                  <p className="text-xs text-on-tertiary-fixed-variant">
                    {vehicles[1]?.nickname || vehicles[1]?.name || "Vehicle"}: replacement recommended soon.
                  </p>
                </div>
                <span className="text-xs font-bold text-error">Critical</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-secondary-fixed rounded-lg">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-secondary">
                  <Icon name="tire_repair" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-secondary-fixed">Tire Pressure Optimization</h4>
                  <p className="text-xs text-on-secondary-fixed-variant">
                    {vehicles[0]?.nickname || vehicles[0]?.name || "Vehicle"}: minor pressure correction advised.
                  </p>
                </div>
                <span className="text-xs font-bold text-secondary">Minor</span>
              </div>
            </div>
          </motion.div>

          <div className="md:col-span-12 lg:col-span-8 space-y-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-headline font-bold text-2xl">Managed Vehicles</h3>
              <Link
                to="/customer/profile"
                className="text-sm font-bold text-secondary flex items-center gap-1 hover:underline"
              >
                View All Garage <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map((vehicle, idx) => (
                <motion.div
                  key={vehicle.id}
                  className="group bg-surface-container-low rounded-2xl overflow-hidden hover:bg-surface-container-high transition-all duration-300"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + idx * 0.08 }}
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      src={vehicleImages[idx % vehicleImages.length]}
                      alt={vehicle.name}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-headline font-extrabold text-xl">{vehicle.nickname || vehicle.name}</h4>
                        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-tighter">
                          Mileage: {vehicle.mileageKm ?? vehicle.mileage ?? "—"} km | Last service {vehicle.lastServiceDate || vehicle.lastService || "—"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                          vehicle.healthScore >= 90
                            ? "bg-on-secondary-container text-white"
                            : "bg-tertiary-container text-on-tertiary-container"
                        }`}
                      >
                        {vehicle.healthScore >= 90 ? "OPTIMAL" : "SERVICE DUE"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Mileage</p>
                        <p className="text-sm font-bold">{vehicle.mileageKm ?? vehicle.mileage ?? "—"} km</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Health</p>
                        <p
                          className={`text-sm font-bold ${
                            vehicle.healthScore >= 90
                              ? "text-emerald-600"
                              : vehicle.healthScore >= 70
                                ? "text-amber-600"
                                : "text-error"
                          }`}
                        >
                          {vehicle.healthScore} / 100
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="md:col-span-12 lg:col-span-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container flex flex-col h-full">
              <h3 className="font-headline font-bold text-xl mb-6">Recent Activity</h3>
              <div className="space-y-6 flex-1">
                {activity.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? "bg-secondary" : "bg-surface-container-highest"}`} />
                      {index !== activity.length - 1 && (
                        <div className="w-px flex-1 bg-surface-container-high mt-2" />
                      )}
                    </div>
                    <div className={index !== activity.length - 1 ? "pb-6" : ""}>
                      <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">
                        {item.date}
                      </p>
                      <h5 className="text-sm font-bold text-on-surface">
                        {item.type === "Order" ? "Parts Purchase" : "Service Update"}
                      </h5>
                      <p className="text-xs text-on-surface-variant">
                        {item.description} {item.amount ? `— ${item.amount}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/customer/orders"
                className="mt-8 text-center text-xs font-bold text-secondary uppercase tracking-widest py-3 border-t border-surface-container hover:bg-surface-container-low transition-all rounded-b-xl"
              >
                Download Full History
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.button
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            toast("Opening service booking...", "info");
            navigate("/customer/booking");
          }}
          aria-label="Open booking"
        >
          <Icon name="add" filled />
        </motion.button>

        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
          <p className="text-sm text-on-surface-variant">
            <span className="font-semibold text-secondary">Loyalty Program:</span> 10% discount applies when a single purchase exceeds $5,000.
            {loyaltyEligible ? " You currently qualify based on recent activity." : " Make a qualifying purchase to unlock discount."}
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
       