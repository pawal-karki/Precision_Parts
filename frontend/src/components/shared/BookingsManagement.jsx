import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { motion, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/currency";
import { api } from "@/lib/api";

const timeSlots = ["09:00 AM", "11:30 AM", "02:15 PM", "04:45 PM"];
const statuses = ["Booked", "Confirmed", "InProgress", "Completed", "Cancelled"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function BookingsManagement({ role = "Admin" }) {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedTime, setSelectedTime] = useState("09:00 AM");
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [notes, setNotes] = useState("");
  const [occupancyData, setOccupancyData] = useState([]);

  const isStaff = role === "Staff";
  const apiPrefix = isStaff ? "getStaff" : "getAdmin";

  useEffect(() => {
    loadData();
  }, [role]);

  useEffect(() => {
    if (showForm) {
      fetchOccupancy();
    }
  }, [selectedDay, calMonth, calYear, showForm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, c, s] = await Promise.all([
        role === "Admin" ? api.getAdminAppointments() : api.getStaffAppointments(),
        api.getCustomers(),
        api.getAvailableServices()
      ]);
      setBookings(b || []);
      setCustomers(c || []);
      setServices(s || []);
    } catch (err) {
      toast("Failed to load bookings data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOccupancy = async () => {
    try {
      const date = new Date(calYear, calMonth, selectedDay).toISOString();
      const data = role === "Admin" 
        ? await api.getAdminSlotOccupancy(date) 
        : await api.getStaffSlotOccupancy(date);
      setOccupancyData(data || []);
    } catch (err) {
      console.error("Failed to fetch occupancy", err);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (isStaff) {
        await api.updateStaffAppointmentStatus(id, newStatus);
      } else {
        await api.updateAppointmentStatus(id, newStatus);
      }
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast(`Status updated to ${newStatus}`, "success");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedCustomerId || selectedServiceIds.length === 0) {
      toast("Please select a customer and at least one service", "error");
      return;
    }

    try {
      const scheduledAt = new Date(calYear, calMonth, selectedDay);
      // Adjust time based on selectedTime
      const [h, mPart] = selectedTime.split(":");
      const [m, ampm] = mPart.split(" ");
      let hours = parseInt(h);
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      scheduledAt.setHours(hours, parseInt(m), 0, 0);

      const dto = {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId || null,
        scheduledAt: scheduledAt.toISOString(),
        serviceTypeIds: selectedServiceIds,
        notes: notes,
        pickupRequired: false
      };

      if (isStaff) {
        await api.staffCreateAppointment(dto);
      } else {
        await api.adminCreateAppointment(dto);
      }

      toast("Booking created successfully", "success");
      setShowForm(false);
      loadData();
      resetForm();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setSelectedVehicleId("");
    setSelectedServiceIds([]);
    setNotes("");
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  const getSlotOccupancy = (time) => {
    const [h, mPart] = time.split(":");
    const [m, ampm] = mPart.split(" ");
    let hours = parseInt(h);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    const target = new Date(calYear, calMonth, selectedDay);
    target.setHours(hours, parseInt(m), 0, 0);
    
    const occ = occupancyData.find(o => new Date(o.timeSlot).getTime() === target.getTime());
    return occ ? { count: occ.occupancy, full: occ.isFull } : { count: 0, full: false };
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Icon name="progress_activity" className="text-secondary text-4xl animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface dark:text-white">{role} Booking Management</h1>
          <p className="text-on-surface-variant text-sm">Oversee and schedule customer service appointments.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-sm"
        >
          <Icon name={showForm ? "close" : "add"} />
          {showForm ? "Cancel" : "New Booking"}
        </button>
      </div>

      {showForm && (
        <motion.div 
          className="bg-surface-container-low dark:bg-neutral-900 rounded-xl p-6 border border-outline-variant shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
            <Icon name="event" className="text-secondary" />
            Create Booking for Customer
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1: Customer & Vehicle */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline mb-1 uppercase">Select Customer</label>
                <select 
                  className="w-full p-2 bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant rounded dark:text-white"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.userId}>{c.fullName} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-outline mb-1 uppercase">Notes</label>
                <textarea 
                  className="w-full p-2 bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant rounded dark:text-white h-24"
                  placeholder="Additional instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Step 2: Date & Time */}
            <div className="space-y-4">
              <div className="bg-surface-container-lowest dark:bg-neutral-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm dark:text-white">{monthNames[calMonth]} {calYear}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCalMonth(m => m === 0 ? 11 : m - 1)} className="p-1"><Icon name="chevron_left" /></button>
                    <button onClick={() => setCalMonth(m => m === 11 ? 0 : m + 1)} className="p-1"><Icon name="chevron_right" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-outline uppercase mb-1">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    return (
                      <button 
                        key={d} 
                        onClick={() => setSelectedDay(d)}
                        className={`p-1 text-xs rounded-full ${d === selectedDay ? "bg-secondary text-white" : "hover:bg-surface-container dark:text-neutral-300"}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(slot => {
                  const occ = getSlotOccupancy(slot);
                  return (
                    <button 
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`p-2 text-xs border rounded flex flex-col items-center transition-all ${
                        selectedTime === slot 
                          ? "bg-secondary text-white border-secondary" 
                          : "bg-surface-container-lowest dark:bg-neutral-800 border-outline-variant dark:text-neutral-300"
                      } ${occ.full ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                      disabled={occ.full}
                    >
                      <span className="font-bold">{slot}</span>
                      <span className={`text-[9px] ${selectedTime === slot ? "text-white/80" : "text-outline"}`}>
                        {occ.count}/7 Booked {occ.full && "(Full)"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Services */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-outline mb-1 uppercase">Select Services</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {services.map(svc => (
                  <label key={svc.id} className="flex items-center gap-3 p-2 bg-surface-container-lowest dark:bg-neutral-800 rounded border border-outline-variant cursor-pointer hover:bg-stone-50 dark:hover:bg-neutral-700">
                    <input 
                      type="checkbox" 
                      checked={selectedServiceIds.includes(svc.id)}
                      onChange={() => setSelectedServiceIds(prev => prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id])}
                      className="rounded text-primary"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-xs font-bold dark:text-white">{svc.name}</span>
                        <span className="text-xs text-secondary font-bold">{formatCurrency(svc.price)}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button 
                onClick={handleCreateBooking}
                className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-bold text-sm shadow-md"
              >
                Create Appointment
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bookings Table */}
      <div className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl overflow-hidden border border-outline-variant">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container dark:bg-neutral-800">
          <h3 className="font-bold text-on-surface dark:text-white">Active Bookings</h3>
          <div className="flex gap-2">
             {/* Search/Filter could go here */}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high dark:bg-neutral-800 text-[10px] font-bold text-outline uppercase tracking-wider">
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant dark:divide-neutral-800/50">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-surface-container dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold dark:text-white">{b.referenceNumber}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold dark:text-white">{b.customerName}</div>
                    <div className="text-[10px] text-outline">{b.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm dark:text-neutral-300">
                      {new Date(b.scheduledAtUtc).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-secondary font-bold">
                      {new Date(b.scheduledAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-neutral-300">{b.vehicleName || "N/A"}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={b.status} 
                      onChange={(e) => handleStatusUpdate(b.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase py-1 px-2 rounded-full border-none focus:ring-0 ${
                        b.status === 'Completed' ? 'bg-tertiary-container text-on-tertiary-container' :
                        b.status === 'Cancelled' ? 'bg-error-container text-on-error-container' :
                        'bg-secondary-container text-on-secondary-container'
                      }`}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="p-2 hover:bg-surface-container-high dark:hover:bg-neutral-700 rounded-lg text-outline"
                      title="View Details"
                    >
                      <Icon name="visibility" />
                    </button>
                    {!isStaff && (
                      <button 
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this booking?")) {
                            await api.deleteAppointment(b.id);
                            setBookings(prev => prev.filter(item => item.id !== b.id));
                            toast("Deleted successfully", "success");
                          }
                        }}
                        className="p-2 hover:bg-error-container hover:text-error rounded-lg"
                        title="Delete"
                      >
                        <Icon name="delete" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <div className="text-center py-20 text-on-surface-variant">
              <Icon name="event_busy" className="text-4xl mb-2 opacity-20" />
              <p>No appointments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
