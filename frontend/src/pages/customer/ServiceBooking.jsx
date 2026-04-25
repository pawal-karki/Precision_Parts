import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { motion, PageTransition, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { formatCurrency, VAT_RATE } from "@/lib/currency";
import { api } from "@/lib/api";
import { generateServiceInvoicePdf, downloadPdf } from "@/lib/pdf";

// Services dynamically loaded from API

const timeSlots = ["09:00 AM", "11:30 AM", "02:15 PM", "04:45 PM"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function ServiceBooking() {
  const toast = useToast();
  const navigate = useNavigate();
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedTime, setSelectedTime] = useState("11:30 AM");
  const [selectedServices, setSelectedServices] = useState([1, 3]);
  const [pastBookings, setPastBookings] = useState([]);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [appts, svcs] = await Promise.all([
          api.getAppointments(),
          api.getAvailableServices()
        ]);
        if (!cancelled) {
          if (Array.isArray(appts)) {
            const formatted = appts.map(book => ({
              id: book.referenceNumber,
              realId: book.id,
              date: new Date(book.scheduledAtUtc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              services: book.services?.join(", ") || "General Service",
              status: book.status
            }));
            setPastBookings(formatted);
          }
          if (Array.isArray(svcs)) {
            setServices(svcs.map(s => ({
              id: s.id,
              name: s.name,
              price: s.price || 0,
              desc: s.description || "Precision auto care service."
            })));
            if (svcs.length > 0) setSelectedServices([svcs[0].id]);
          }
        }
      } catch {
        if (!cancelled) {
          toast("Error loading booking availability.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedItems = services.filter((s) => selectedServices.includes(s.id));
  const subtotal = selectedItems.reduce((sum, s) => sum + s.price, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      toast("Please select at least one service", "error");
      return;
    }
    try {
      const dateStr = `${monthNames[calMonth]} ${selectedDay}, ${calYear}`;
      const result = await api.createAppointment({
        scheduledAt: new Date(calYear, calMonth, selectedDay).toISOString(),
        pickupRequired: false,
        notes: `Services: ${selectedItems.map(s => s.name).join(", ")}`,
        serviceTypeIds: selectedItems.map(s => s.id),
      });
      navigate("/customer/booking-success", {
        state: {
          booking: {
            referenceNumber: result?.referenceNumber || `SRV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
            date: dateStr,
            time: selectedTime,
            vehicle: "My Vehicle",
            services: selectedItems.map(s => ({ name: s.name, price: s.price })),
            total,
          }
        }
      });
    } catch (err) {
      toast(err.message || "Failed to confirm booking. Please try again.", "error");
    }
  };

  const prevMonthDays = getDaysInMonth(calYear, calMonth === 0 ? 11 : calMonth - 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icon name="progress_activity" className="text-secondary text-4xl animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-10">
        {/* Header */}
        <motion.header variants={fadeInUp} initial="initial" animate="animate">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-headline text-on-surface dark:text-white mb-2">
            Service Booking
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-400 max-w-2xl">
            Configure your industrial maintenance schedule with precision. Select your required services and preferred timeline.
          </p>
        </motion.header>

        {/* Booking Flow Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar */}
          <motion.div
            className="lg:col-span-4 bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-bold font-headline text-lg mb-4 flex items-center gap-2 dark:text-white">
              <Icon name="event" className="text-secondary" />
              Select Date
            </h2>
            <div className="bg-surface-container-lowest dark:bg-neutral-800 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold font-headline text-on-surface dark:text-white">
                  {monthNames[calMonth]} {calYear}
                </span>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-1 hover:bg-surface-container dark:hover:bg-neutral-700 rounded transition-colors">
                    <Icon name="chevron_left" className="text-sm" />
                  </button>
                  <button onClick={nextMonth} className="p-1 hover:bg-surface-container dark:hover:bg-neutral-700 rounded transition-colors">
                    <Icon name="chevron_right" className="text-sm" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-outline uppercase mb-2">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-outline-variant text-sm">
                    {prevMonthDays - firstDay + i + 1}
                  </div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isSelected = day === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square flex items-center justify-center text-sm transition-colors rounded-full ${
                        isSelected
                          ? "bg-secondary text-on-secondary font-bold"
                          : "text-on-surface dark:text-neutral-300 hover:bg-surface-container dark:hover:bg-neutral-700"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time Slots */}
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-outline uppercase tracking-wider mb-2 text-left">Available Time Slots</div>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 text-xs font-bold rounded transition-colors ${
                        selectedTime === slot
                          ? "bg-secondary-fixed text-on-secondary-fixed border border-secondary-dim/20"
                          : "bg-surface-container dark:bg-neutral-700 text-on-surface-variant hover:bg-secondary-container"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Service Selection */}
          <motion.div
            className="lg:col-span-5 flex flex-col gap-4"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 }}
          >
            <div className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-6 h-full">
              <h2 className="font-bold font-headline text-lg mb-4 flex items-center gap-2 dark:text-white">
                <Icon name="build" className="text-secondary" />
                Service Selection
              </h2>
              <div className="space-y-3">
                {services.map((svc) => {
                  const isChecked = selectedServices.includes(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={`group relative flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                        isChecked
                          ? "bg-secondary-container/30 dark:bg-neutral-800 ring-2 ring-secondary/20"
                          : "bg-surface-container-lowest dark:bg-neutral-800 ring-1 ring-transparent hover:ring-outline-variant/30 hover:bg-stone-100 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleService(svc.id)}
                        className="mt-1 rounded border-outline-variant text-secondary focus:ring-secondary"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-on-surface dark:text-white">{svc.name}</span>
                          <span className="text-sm font-bold font-headline text-secondary">{formatCurrency(svc.price)}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant">{svc.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Booking Summary */}
          <motion.div
            className="lg:col-span-3"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <div className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 shadow-[0_12px_40px_rgba(45,52,50,0.06)] sticky top-24 border border-stone-200/50 dark:border-neutral-700/50">
              <h2 className="font-extrabold font-headline text-xl mb-6 dark:text-white">Booking Summary</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-start">
                  <div className="text-xs text-on-surface-variant font-medium">Service Date</div>
                  <div className="text-sm font-bold text-right dark:text-white">
                    {monthNames[calMonth].slice(0, 3)} {String(selectedDay).padStart(2, "0")}, {calYear}
                    <br />
                    <span className="text-secondary">{selectedTime}</span>
                  </div>
                </div>
                <div className="space-y-2 border-t border-stone-100 dark:border-neutral-700/50 pt-4">
                  {selectedItems.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{s.name.split(" ").slice(-1)[0]}</span>
                      <span className="font-semibold dark:text-white">{formatCurrency(s.price)}</span>
                    </div>
                  ))}
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">VAT (13%)</span>
                      <span className="font-semibold dark:text-white">{formatCurrency(vat)}</span>
                    </div>
                </div>
                <div className="flex justify-between border-t-2 border-stone-100 dark:border-neutral-700/50 pt-4 items-baseline">
                  <span className="font-bold font-headline text-on-surface dark:text-white">Total Est.</span>
                  <span className="text-2xl font-extrabold font-headline text-secondary">
                    {selectedItems.length > 0 ? formatCurrency(total) : "Rs. 0.00"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  className="w-full py-4 bg-primary dark:bg-neutral-700 text-on-primary dark:text-white rounded-lg font-bold text-sm tracking-wide hover:bg-primary-dim transition-all active:scale-[0.98]"
                >
                  Confirm Booking
                </button>
                <button className="w-full py-3 bg-surface-container-low dark:bg-neutral-800 text-on-surface-variant rounded-lg font-bold text-xs tracking-wide hover:bg-surface-container transition-all">
                  Save for Later
                </button>
              </div>
              <div className="mt-6 p-3 bg-tertiary-container/40 dark:bg-neutral-800 rounded-lg flex gap-3 items-center">
                <Icon name="verified_user" className="text-tertiary text-lg" />
                <p className="text-[10px] text-on-tertiary-container dark:text-neutral-400 leading-tight">
                  Your service is backed by our Precision Guarantee. Full data reports included.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Service History Table */}
        <motion.section
          className="mt-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 mb-6">
            <div>
              <h3 className="font-extrabold font-headline text-xl sm:text-2xl text-on-surface dark:text-white">Service History</h3>
              <p className="text-on-surface-variant text-sm">Track past maintenance and booked appointments.</p>
            </div>
          </div>
          <div className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[520px]">
              <thead className="bg-surface-container-high dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Service ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Services Performed</th>
                  <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container dark:divide-neutral-800/50">
                {pastBookings.map((booking, i) => (
                  <tr key={booking.id} className={`hover:bg-surface-container dark:hover:bg-neutral-800 transition-colors ${i % 2 === 1 ? "bg-white/40 dark:bg-[#0A0A0A]/30" : ""}`}>
                    <td className="px-6 py-4 font-bold font-headline text-sm dark:text-white">{booking.id}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{booking.date}</td>
                    <td className="px-6 py-4 text-sm text-on-surface dark:text-neutral-200">{booking.services}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                        booking.status === "Completed"
                          ? "bg-tertiary-container text-on-tertiary-container"
                          : "bg-stone-200 dark:bg-neutral-700 text-stone-500"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                        <button
                          className="px-3 py-1 bg-error-container text-on-error-container text-xs font-bold rounded hover:bg-error hover:text-white transition-colors"
                          onClick={async () => {
                            try {
                              await api.cancelAppointment(booking.realId);
                              setPastBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: "Cancelled" } : b));
                              toast("Appointment cancelled successfully", "success");
                            } catch (err) {
                              toast(err.message || "Failed to cancel appointment", "error");
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          booking.status === "Cancelled"
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-stone-200 dark:hover:bg-neutral-700"
                        }`}
                        disabled={booking.status === "Cancelled"}
                        onClick={() => {
                          if (booking.status !== "Cancelled") {
                            // In a real app we'd pass the auth user context here
                            const user = { fullName: "Valued Customer", email: "" };
                            const doc = generateServiceInvoicePdf(booking, user);
                            downloadPdf(doc, `Invoice_${booking.id}.pdf`);
                            toast("Invoice downloaded as PDF", "success");
                          }
                        }}
                      >
                        <Icon name="download" className="text-stone-600 dark:text-neutral-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pastBookings.length === 0 && (
              <div className="text-center py-10 text-on-surface-variant">
                <Icon name="event_busy" className="text-4xl mb-2" />
                <p className="text-sm">No bookings yet. Book your first service above!</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </PageTransition>
  );
}
     