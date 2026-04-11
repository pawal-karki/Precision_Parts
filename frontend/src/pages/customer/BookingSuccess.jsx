import { useLocation, useNavigate, Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { formatCurrency } from "@/lib/currency";

export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  // If no booking data, redirect to booking page
  if (!booking) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <Icon name="event_busy" className="text-6xl text-on-surface-variant/30" />
          <h2 className="text-2xl font-headline font-bold text-on-surface dark:text-white">No booking found</h2>
          <p className="text-on-surface-variant max-w-md">
            It seems you navigated here directly. Please book a service first.
          </p>
          <Button variant="secondary" onClick={() => navigate("/customer/booking")}>
            <Icon name="calendar_month" className="text-sm" /> Book a Service
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success animation */}
        <motion.div
          className="flex flex-col items-center text-center gap-6 pt-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          {/* Animated check circle */}
          <motion.div
            className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
            >
              <Icon name="check_circle" filled className="text-5xl text-green-600 dark:text-green-400" />
            </motion.div>
          </motion.div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-surface dark:text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-on-surface-variant text-lg">
              Your service appointment has been successfully scheduled.
            </p>
          </div>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          className="bg-surface-container-lowest dark:bg-stone-900 rounded-2xl border border-surface-container-low dark:border-stone-800 overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Card header */}
          <div className="bg-secondary/5 dark:bg-secondary/10 px-8 py-5 border-b border-surface-container-low dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <Icon name="precision_manufacturing" filled className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface dark:text-white">Precision Parts</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Service Confirmation</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Reference</p>
                <p className="text-lg font-mono font-bold text-secondary">{booking.referenceNumber || "SRV-" + Date.now().toString(36).toUpperCase().slice(-6)}</p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 block">Date & Time</label>
                <p className="text-on-surface dark:text-white font-semibold">{booking.date || "—"}</p>
                <p className="text-sm text-on-surface-variant">{booking.time || ""}</p>
              </div>
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 block">Vehicle</label>
                <p className="text-on-surface dark:text-white font-semibold">{booking.vehicle || "—"}</p>
              </div>
              {booking.pickup && (
                <div>
                  <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 block">Pickup</label>
                  <div className="flex items-center gap-1.5">
                    <Icon name="local_shipping" className="text-sm text-secondary" />
                    <span className="text-on-surface dark:text-white font-semibold">Pickup & Drop-off included</span>
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            {booking.services && booking.services.length > 0 && (
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-3 block">Selected Services</label>
                <div className="space-y-2">
                  {booking.services.map((service, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-4 bg-surface-container-low dark:bg-stone-800 rounded-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="build" className="text-sm text-secondary" />
                        <span className="text-sm font-medium text-on-surface dark:text-white">{service.name}</span>
                      </div>
                      <span className="text-sm font-bold text-on-surface dark:text-white">
                        {formatCurrency(service.price)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            {booking.total !== undefined && (
              <div className="flex items-center justify-between pt-4 border-t border-surface-container-low dark:border-stone-800">
                <span className="text-on-surface-variant font-semibold">Estimated Total</span>
                <span className="text-2xl font-extrabold font-headline text-on-surface dark:text-white">
                  {formatCurrency(booking.total)}
                </span>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="bg-tertiary-container/30 dark:bg-tertiary-container/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="info" className="text-sm text-on-tertiary-container" />
                  <span className="text-xs font-bold text-on-tertiary-container uppercase tracking-wider">Notes</span>
                </div>
                <p className="text-sm text-on-surface-variant">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Card footer */}
          <div className="px-8 py-5 bg-surface-container-low/50 dark:bg-stone-800/50 border-t border-surface-container-low dark:border-stone-800">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <Icon name="schedule" className="text-sm" />
              <span>You'll receive a confirmation email shortly. We'll send reminders before your appointment.</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate("/customer/orders")}
          >
            <Icon name="receipt_long" className="text-sm" />
            View Service History
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/customer")}
          >
            <Icon name="dashboard" className="text-sm" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {[
            { icon: "notifications", title: "Get Reminders", desc: "We'll notify you before your appointment" },
            { icon: "smart_toy", title: "AI Diagnostics", desc: "View predictive maintenance insights" },
            { icon: "support_agent", title: "Need Help?", desc: "Contact us at support@precision.com" },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-surface-container-low dark:bg-stone-900 text-center">
              <Icon name={item.icon} className="text-2xl text-secondary mb-2" />
              <h4 className="text-sm font-bold text-on-surface dark:text-white mb-1">{item.title}</h4>
              <p className="text-xs text-on-surface-variant">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </PageTransition>
  );
}
           