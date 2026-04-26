import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { motion, fadeInUp, AnimatePresence, PageTransition } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/data-table";
import { Calendar } from "@/components/ui/calendar";

const timeSlots = ["09:00 AM", "11:30 AM", "02:15 PM", "04:45 PM"];
const statuses = ["Booked", "Confirmed", "InProgress", "Completed", "Cancelled"];

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

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, dateFilter]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = 
        (b.customerName || "").toLowerCase().includes(search.toLowerCase()) || 
        (b.referenceNumber || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = activeFilter === "All" || b.status === activeFilter;
      const matchesDate = !dateFilter || new Date(b.scheduledAtUtc).toISOString().slice(0, 10) === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, search, activeFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    <PageTransition className="space-y-10">
      <section className="flex flex-col md:flex-row justify-between md:items-end items-start gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
            {role} Booking Management
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Oversee and schedule customer service appointments.
          </p>
        </div>
        <Button 
          variant={showForm ? "outline" : "secondary"} 
          onClick={() => setShowForm(!showForm)}
        >
          <Icon name={showForm ? "close" : "add"} className="text-sm" />
          {showForm ? "Cancel" : "New Booking"}
        </Button>
      </section>

      {/* Filters & Search */}
      <div className="relative z-50 flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-surface-container-lowest dark:bg-[#1C1C1C] p-2 rounded-2xl border border-outline-variant shadow-sm backdrop-blur-sm">
        <div className="relative flex-1 max-w-md group">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-secondary transition-colors" />
          <Input 
            placeholder="Search by customer name or reference..." 
            className="pl-12 h-12 text-sm bg-surface-container-low/50 dark:bg-neutral-800/30 border-none rounded-xl focus:ring-0 focus:outline-none transition-all group-hover:bg-surface-container dark:group-hover:bg-neutral-800/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <div className="relative">
            <Button 
              variant="outline" 
              className={cn(
                "w-56 justify-start text-left font-medium h-12 text-sm border-outline-variant hover:border-secondary/50 transition-all",
                !dateFilter && "text-on-surface-variant/50"
              )}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <Icon name="calendar_today" className="mr-3 h-4 w-4 text-secondary" />
              {dateFilter ? new Date(dateFilter).toLocaleDateString(undefined, { dateStyle: 'medium' }) : <span>Filter by date</span>}
            </Button>

            {showDatePicker && (
              <div className="absolute top-[calc(100%+8px)] left-0 z-[100]">
                <div 
                  className="fixed inset-0 cursor-default" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDatePicker(false);
                  }}
                />
                <Calendar
                  className="relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl"
                  selected={dateFilter ? new Date(dateFilter) : null}
                  onSelect={(date) => {
                    setDateFilter(date.toISOString().split("T")[0]);
                    setShowDatePicker(false);
                  }}
                />
              </div>
            )}
          </div>

          {dateFilter && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-outline-variant hover:text-error hover:bg-error/10"
              onClick={() => setDateFilter("")}
            >
              <Icon name="close" className="h-4 w-4" />
            </Button>
          )}

          <div className="h-8 w-[1px] bg-outline-variant mx-2 hidden lg:block" />

          <div className="flex gap-1">
            {["All", ...statuses].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all",
                  activeFilter === filter
                    ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                    : "text-on-surface-variant hover:bg-surface-container dark:hover:bg-neutral-800"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
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
              <Calendar
                selected={new Date(calYear, calMonth, selectedDay)}
                onSelect={(date) => {
                  setSelectedDay(date.getDate());
                  setCalMonth(date.getMonth());
                  setCalYear(date.getFullYear());
                }}
              />
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-outline uppercase tracking-wider ml-1">Select Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map(slot => {
                    const occ = getSlotOccupancy(slot);
                    return (
                      <button 
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "px-3 py-2 text-xs border rounded-lg flex flex-col items-center justify-center transition-all duration-200",
                          selectedTime === slot 
                            ? "bg-secondary text-white border-secondary shadow-md scale-[1.02]" 
                            : "bg-surface-container-lowest dark:bg-neutral-800 border-outline-variant dark:text-neutral-300 hover:border-secondary/50",
                          occ.full && "opacity-50 grayscale cursor-not-allowed bg-slate-100 dark:bg-neutral-900"
                        )}
                        disabled={occ.full}
                      >
                        <span className="font-bold">{slot}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            occ.full ? "bg-error" : (occ.count > 5 ? "bg-amber-400" : "bg-emerald-400")
                          )} />
                          <span className={cn(
                            "text-[9px] tracking-tight",
                            selectedTime === slot ? "text-white/80" : "text-outline"
                          )}>
                            {occ.count}/7 Booked
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
      <div className="overflow-x-auto bg-white dark:bg-[#1C1C1C] rounded-xl border border-surface-container-low dark:border-neutral-800/50 mt-6 shadow-sm">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <tr className="bg-surface-container-low/50 dark:bg-neutral-900/50 border-b border-surface-container dark:border-neutral-800">
                <TableHead className="px-6">Reference</TableHead>
                <TableHead className="px-6">Customer</TableHead>
                <TableHead className="px-6">Date & Time</TableHead>
                <TableHead className="px-6">Vehicle</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6 text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {paginatedBookings.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-b border-surface-container-low/50 dark:border-neutral-800/30 hover:bg-surface-container-low/30 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <TableCell className="px-6 font-bold dark:text-white">{b.referenceNumber}</TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-neutral-300">
                          {(b.customerName || "U").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface dark:text-neutral-200">{b.customerName}</div>
                          <div className="text-[10px] text-outline">{b.customerEmail}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="dark:text-neutral-300">
                        {new Date(b.scheduledAtUtc).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-secondary font-bold">
                        {new Date(b.scheduledAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 dark:text-neutral-300">{b.vehicleName || "N/A"}</TableCell>
                    <TableCell className="px-6">
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
                    </TableCell>
                    <TableCell className="px-6 text-right space-x-1">
                      <button 
                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-surface-container-low dark:hover:bg-neutral-800 hover:text-on-surface dark:hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Icon name="visibility" className="text-base" />
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
                          className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-error/10 hover:text-error transition-colors"
                          title="Delete"
                        >
                          <Icon name="delete" className="text-base" />
                        </button>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
          {paginatedBookings.length === 0 && (
            <div className="text-center py-20 text-on-surface-variant">
              <Icon name="event_busy" className="text-4xl mb-2 opacity-20" />
              <p>No appointments found.</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-surface-container dark:border-neutral-800">
              <span className="text-sm text-outline font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors dark:text-neutral-300"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Icon name="chevron_left" className="text-sm" /> Previous
                </button>
                <div className="text-sm font-bold dark:text-white px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors dark:text-neutral-300"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <Icon name="chevron_right" className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
