import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { api, getImageUrl } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatNpt, formatDate } from "@/lib/utils";
import { formatCurrency, parseMoneyAmount } from "@/lib/currency";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from "@/components/ui/data-table";

const TABS = ["Overview", "Vehicles", "Service History", "Purchases", "Part requests", "Activity Log", "Login Activity"];

const TYPES = ["Business", "Individual"];
const STATUSES = ["Active", "Inactive", "Credit Overdue"];
const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

// ── Pagination Component ─────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <Icon name="chevron_left" className="text-sm" /> Previous
      </button>
      <span className="text-sm text-slate-500 font-medium px-2">
        Page {page} of {totalPages}
      </span>
      <button
        className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next <Icon name="chevron_right" className="text-sm" />
      </button>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────

function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-14 bg-slate-100 dark:bg-neutral-800 rounded-xl" />
      ))}
    </div>
  );
}

// ── Tab Contents ─────────────────────────────────────────────────────────

function OverviewTab({ customer, report, reportLoading }) {
  const recentPurchases = report?.recentPurchases ?? [];
  const toast = useToast();

  const sendEmail = async (invoiceId) => {
    if (!invoiceId) {
      toast("Invoice ID is missing", "error");
      return;
    }
    try {
      await api.sendInvoiceEmail(invoiceId);
      toast("Invoice email queued successfully", "success");
    } catch (e) {
      toast("Failed to queue invoice email", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Spent", value: formatCurrency(Number(report?.totalSpent ?? 0)), icon: "payments", color: "text-secondary" },
          { label: "Outstanding Credit", value: formatCurrency(Number(report?.outstandingCredit ?? 0)), icon: "account_balance", color: report?.outstandingCredit > 0 ? "text-red-500" : "text-emerald-600" },
          { label: "Appointments", value: report?.appointmentCount ?? "—", icon: "calendar_month", color: "text-violet-600" },
          { label: "Vehicles", value: report?.vehicleCount ?? customer?.vehicles?.length ?? "—", icon: "directions_car", color: "text-amber-600" },
          { label: "Part requests", value: reportLoading ? "—" : (report?.partRequestCount ?? 0), icon: "build", color: "text-teal-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-[#1C1C1C] rounded-xl p-4 border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={stat.icon} className={`text-sm ${stat.color}`} />
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{stat.label}</p>
            </div>
            <p className={`text-2xl font-extrabold ${stat.color}`}>
              {reportLoading ? <span className="block h-7 w-16 bg-slate-100 dark:bg-neutral-700 rounded animate-pulse" /> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top-5 Recent Purchases */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
          <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">Recent Purchases (Top 5)</h3>
        </div>
        {reportLoading ? (
          <div className="p-6"><TabSkeleton /></div>
        ) : recentPurchases.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">No purchases on record.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPurchases.map(p => (
                <TableRow key={p.invoiceNumber}>
                  <TableCell className="font-mono text-secondary dark:text-secondary">{p.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(p.issueDate)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(Number(p.totalAmount ?? 0))}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Paid" ? "success" : p.status === "Unpaid" ? "warning" : "neutral"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => sendEmail(p.id)}
                      className="flex items-center gap-1"
                    >
                      <Icon name="mail" className="text-sm" /> Send PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function VehiclesTab({ customer }) {
  const vehicles = customer?.vehicles ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {vehicles.length === 0 ? (
        <p className="text-slate-500 col-span-2 text-center py-12">No vehicles registered.</p>
      ) : (
        vehicles.map((vehicle, i) => (
          <div key={i} className="bg-white dark:bg-[#1C1C1C] rounded-xl p-6 border border-slate-200 dark:border-neutral-800">
            <div className="h-28 bg-slate-100 dark:bg-neutral-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {vehicle.imageUrl ? (
                <img src={getImageUrl(vehicle.imageUrl)} alt={typeof vehicle === "string" ? vehicle : vehicle.name} className="w-full h-full object-cover" />
              ) : (
                <Icon name="directions_car" className="text-4xl text-slate-300 dark:text-neutral-600" />
              )}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">{typeof vehicle === "string" ? vehicle : vehicle.name}</h4>
            <div className="flex gap-2 mt-2">
              <Badge variant="info">Linked</Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ServiceHistoryTab({ publicId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!publicId) return;
    api.getCustomerServiceHistory(publicId)
      .then(setAppointments)
      .catch(() => toast("Failed to load service history", "error"))
      .finally(() => setLoading(false));
  }, [publicId, toast]);

  return (
    <div className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">Service History</h3>
      </div>
      {loading ? (
        <div className="p-6"><TabSkeleton /></div>
      ) : appointments.length === 0 ? (
        <p className="text-slate-500 text-sm p-6 text-center">No service history found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref #</TableHead>
              <TableHead>Date (NPT)</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-secondary dark:text-secondary">{a.referenceNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{formatNpt(a.scheduledAtUtc)}</TableCell>
                <TableCell>{a.vehicleName}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={a.services.join(", ")}>
                  {a.services.join(", ")}
                </TableCell>
                <TableCell>
                  <Badge variant={a.status === "Completed" ? "success" : a.status === "Cancelled" ? "error" : "info"}>
                    {a.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function PurchasesTab({ publicId }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const sendEmail = async (invoiceId) => {
    if (!invoiceId) {
      toast("Invoice ID is missing", "error");
      return;
    }
    try {
      await api.sendInvoiceEmail(invoiceId);
      toast("Invoice email queued successfully", "success");
    } catch (e) {
      toast("Failed to queue invoice email", "error");
    }
  };

  useEffect(() => {
    if (!publicId) return;
    api.getCustomerPurchases(publicId)
      .then(setPurchases)
      .catch(() => toast("Failed to load purchase history", "error"))
      .finally(() => setLoading(false));
  }, [publicId, toast]);

  return (
    <div className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">Full Purchase History</h3>
      </div>
      {loading ? (
        <div className="p-6"><TabSkeleton /></div>
      ) : purchases.length === 0 ? (
        <p className="text-slate-500 text-sm p-6 text-center">No purchases recorded.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map(p => (
              <TableRow key={p.invoiceNumber}>
                <TableCell className="font-mono text-secondary dark:text-secondary">{p.invoiceNumber}</TableCell>
                <TableCell>{formatDate(p.issueDate)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(Number(p.totalAmount ?? 0))}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "Paid" ? "success" : p.status === "Unpaid" ? "warning" : "neutral"}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => sendEmail(p.id)}
                    className="flex items-center gap-1"
                  >
                    <Icon name="mail" className="text-sm" /> Send PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function PartRequestsTab({ report, reportLoading }) {
  const list = report?.partRequests ?? [];
  const prBadge = (s) => {
    const x = String(s || "").toLowerCase();
    if (x === "available") return "success";
    if (x === "sourcing") return "info";
    if (x === "cancelled") return "neutral";
    return "warning";
  };
  return (
    <div className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800">
        <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">Custom part requests</h3>
        <p className="text-xs text-slate-500 mt-1">Submitted from the customer portal (Part request).</p>
      </div>
      {reportLoading ? (
        <div className="p-6"><TabSkeleton /></div>
      ) : list.length === 0 ? (
        <p className="text-slate-500 text-sm p-6 text-center">No custom part requests on file.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted (NPT)</TableHead>
              <TableHead>Part</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap text-slate-500">{formatNpt(r.createdAtUtc)}</TableCell>
                <TableCell>
                  <div className="font-bold text-slate-900 dark:text-white">{r.partName}</div>
                  {r.partNumber && <div className="text-xs font-mono text-secondary">{r.partNumber}</div>}
                  {r.description && <div className="text-xs text-slate-500 mt-1 max-w-md line-clamp-2">{r.description}</div>}
                </TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-300">{r.vehicleModel || "—"}</TableCell>
                <TableCell>
                  <Badge variant={String(r.urgency).toLowerCase() === "critical" ? "error" : "neutral"}>{r.urgency || "Normal"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={prBadge(r.status)}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ActivityLogTab({ publicId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const toast = useToast();
  const PAGE_SIZE = 10;

  const fetchPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.getCustomerActivityLog(publicId, p, PAGE_SIZE);
      setData(res);
      setPage(p);
    } catch (e) {
      toast("Failed to load activity log", "error");
    } finally {
      setLoading(false);
    }
  }, [publicId, toast]);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const typeColor = (type) => {
    if (type === "Booking") return "text-violet-600 bg-violet-50 dark:bg-violet-900/20";
    if (type === "Invoice") return "text-secondary bg-secondary/5 dark:bg-secondary/20";
    if (type === "PartRequest") return "text-teal-700 bg-teal-50 dark:bg-teal-900/25 dark:text-teal-300";
    return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">Activity Log</h3>
        {data && <span className="text-xs text-slate-500">{data.totalCount} total events</span>}
      </div>
      {loading ? (
        <div className="p-6"><TabSkeleton /></div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp (NPT)</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs whitespace-nowrap text-slate-500">
                    {formatNpt(item.timestamp)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${typeColor(item.type)}`}>
                      <Icon name={item.icon} className="text-xs" /> {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-slate-500">{item.detail}</TableCell>
                  <TableCell className="text-right font-bold text-slate-700 dark:text-slate-300">{item.amount || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(data?.items ?? []).length === 0 && (
            <p className="text-slate-500 text-sm p-6 text-center">No activity recorded.</p>
          )}
          <div className="px-6 pb-6">
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onPageChange={fetchPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

function LoginActivityTab({ publicId, customer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const toast = useToast();
  const PAGE_SIZE = 10;

  const fetchPage = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.getCustomerLoginActivity(publicId, p, PAGE_SIZE);
      setData(res);
      setPage(p);
    } catch (e) {
      toast("Failed to load login activity", "error");
    } finally {
      setLoading(false);
    }
  }, [publicId, toast]);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`flex items-center gap-4 p-4 rounded-xl border ${
        customer?.status === "Active"
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
          : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      }`}>
        <div className={`w-3 h-3 rounded-full ${customer?.status === "Active" ? "bg-emerald-500" : "bg-red-500"} shadow-lg ring-4 ${customer?.status === "Active" ? "ring-emerald-200" : "ring-red-200"}`} />
        <div>
          <p className="font-bold text-sm">
            Account {customer?.status ?? "Unknown"}
          </p>
          <p className="text-xs text-slate-500">Current account status</p>
        </div>
      </div>

      {/* Login History Table */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-lg font-bold font-headline text-slate-900 dark:text-white">Login History</h3>
          {data && <span className="text-xs text-slate-500">{data.totalCount} sessions</span>}
        </div>
        {loading ? (
          <div className="p-6"><TabSkeleton /></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp (NPT)</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device / Browser</TableHead>
                  <TableHead className="text-right">Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((log, i) => (
                  <TableRow key={log.id ?? `login-${i}`}>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-slate-500">
                      {formatNpt(log.timestampUtc)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{log.ipAddress}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{log.device}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={log.isActive ? "success" : "neutral"}>
                        {log.isActive ? "Active" : "Closed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(data?.items ?? []).length === 0 && (
              <p className="text-slate-500 text-sm p-6 text-center">No login history found.</p>
            )}
            <div className="px-6 pb-6">
              <Pagination
                page={data?.page ?? 1}
                totalPages={data?.totalPages ?? 1}
                onPageChange={fetchPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function CustomerProfile() {
  const { id } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/admin") ? "/admin" : "/staff";
  const [customer, setCustomer] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Individual",
    status: "Active",
    loyaltyTier: "Bronze",
    credit: 0,
    vehicles: [],
  });
  const [vehicleInput, setVehicleInput] = useState("");

  const openEditModal = () => {
    if (!customer) return;
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      type: customer.type || "Individual",
      status: customer.status || "Active",
      loyaltyTier: customer.loyaltyTier || "Bronze",
      credit: customer.credit || 0,
      vehicles: customer.vehicles || [],
    });
    setVehicleInput("");
    setModalOpen(true);
  };

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addVehicle() {
    if (!vehicleInput.trim()) return;
    setForm((f) => ({ ...f, vehicles: [...f.vehicles, vehicleInput.trim()] }));
    setVehicleInput("");
  }

  function removeVehicle(idx) {
    setForm((f) => ({
      ...f,
      vehicles: f.vehicles.filter((_, i) => i !== idx),
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Please fill in name and email", "error");
      return;
    }
    try {
      await api.updateCustomer(customer.id, {
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        customerType: form.type,
        status: form.status,
        loyaltyTier: form.loyaltyTier,
        creditBalance: Number(form.credit) || 0,
      });
      toast(`${form.name} updated successfully`, "success");
      setModalOpen(false);
      api.getCustomers().then((customers) => {
        const found = customers.find((c) => c.id === Number(id) || String(c.id) === String(id));
        setCustomer(found ?? null);
      });
    } catch (err) {
      toast(err.message || "Could not save customer", "error");
    }
  }

  // Load customer from list
  useEffect(() => {
    api.getCustomers().then((customers) => {
      const found = customers.find(
        (c) => c.id === Number(id) || String(c.id) === String(id)
      );
      setCustomer(found ?? null);
    }).catch(() => toast("Failed to load customer", "error"));
  }, [id]);

  // Load detailed report when customer is found
  useEffect(() => {
    if (!id) return;
    setReportLoading(true);
    api.getCustomerDetailedReport(id)
      .then(setReport)
      .catch(() => {
        // Report may fail if not seeded; gracefully degrade
        setReport(null);
      })
      .finally(() => setReportLoading(false));
  }, [id]);

  const downloadReport = async () => {
    if (!report) {
      toast("No report data available", "error");
      return;
    }
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `customer-${id}-report.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Report downloaded", "success");
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-48">
        <Icon name="sync" className="text-3xl animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <>
      <Link
        to={`${basePath}/customers`}
        className="flex items-center gap-1 text-sm text-secondary hover:text-secondary transition-colors mb-6"
      >
        <Icon name="arrow_back" className="text-sm" />
        Back to Customers
      </Link>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column — Profile Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-8 border border-slate-200 dark:border-neutral-800 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-secondary/10 dark:bg-secondary/20 mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl font-extrabold text-secondary">
                {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold font-headline text-slate-900 dark:text-white inline-flex items-center justify-center gap-2 flex-wrap">
              <span>{customer.name}</span>
              {(Number(report?.partRequestCount) > 0 || Number(customer.partRequestCount) > 0) && (
                <span className="text-2xl leading-none" title="Has submitted custom part requests (customer portal)">✅</span>
              )}
            </h2>
            {(Number(report?.partRequestCount) > 0 || Number(customer.partRequestCount) > 0) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
                Custom parts sourcing — open the <span className="font-bold text-secondary">Part requests</span> tab for details.
              </p>
            )}
            <Badge variant={customer.status === "Active" ? "success" : "error"} className="mt-2">
              {customer.status}
            </Badge>

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Icon name="mail" className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Icon name="phone" className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{customer.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Icon name="loyalty" className="text-slate-400" />
                <span className={`font-bold ${
                  customer.loyaltyTier === "Platinum" ? "text-violet-500" :
                  customer.loyaltyTier === "Gold" ? "text-amber-500" : "text-slate-400"
                }`}>
                  {customer.loyaltyTier} Member
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Spent</p>
                <p className="text-lg font-extrabold mt-1 text-slate-900 dark:text-white">
                  {formatCurrency(report?.totalSpent ?? parseMoneyAmount(customer.totalSpent))}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Credit</p>
                <p className={`text-lg font-extrabold mt-1 ${customer.credit > 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {formatCurrency(Number(customer.credit ?? 0))}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button variant="secondary" className="w-full" onClick={openEditModal}>
                <Icon name="edit" className="text-sm" /> Edit Profile
              </Button>
              <Button
                onClick={downloadReport}
                disabled={reportLoading || !report}
                className="w-full bg-secondary hover:bg-secondary text-white flex items-center gap-2 justify-center"
              >
                <Icon name="download" className="text-sm" />
                {reportLoading ? "Loading Report…" : "Generate Detailed Report"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column — Tabs */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Tab Strip */}
          <div className="flex gap-0 border-b border-slate-200 dark:border-neutral-800 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "border-secondary text-secondary dark:text-secondary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <OverviewTab customer={customer} report={report} reportLoading={reportLoading} />
          )}
          {activeTab === "Vehicles" && <VehiclesTab customer={customer} />}
          {activeTab === "Service History" && <ServiceHistoryTab publicId={id} />}
          {activeTab === "Purchases" && <PurchasesTab publicId={id} />}
          {activeTab === "Part requests" && <PartRequestsTab report={report} reportLoading={reportLoading} />}
          {activeTab === "Activity Log" && <ActivityLogTab publicId={id} />}
          {activeTab === "Login Activity" && <LoginActivityTab publicId={id} customer={customer} />}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Customer"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Full Name *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Email *
              </label>
              <Input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Loyalty Tier
              </label>
              <select
                value={form.loyaltyTier}
                onChange={(e) => setField("loyaltyTier", e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest dark:bg-neutral-800 border border-outline-variant dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-secondary"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                Credit (Rs.)
              </label>
              <Input
                type="number"
                value={form.credit}
                onChange={(e) => setField("credit", Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Vehicles */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
              Vehicles
            </label>
            <div className="flex gap-2">
              <Input
                value={vehicleInput}
                onChange={(e) => setVehicleInput(e.target.value)}
                placeholder="e.g. 2024 BMW M3"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addVehicle())
                }
              />
              <Button variant="outline" onClick={addVehicle} type="button">
                <Icon name="add" className="text-sm" />
              </Button>
            </div>
            {form.vehicles?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.vehicles.map((v, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-low dark:bg-neutral-800 rounded-full text-xs font-medium"
                  >
                    {typeof v === "string" ? v : v.name}
                    <button
                      onClick={() => removeVehicle(i)}
                      className="text-on-surface-variant hover:text-error"
                    >
                      <Icon name="close" className="text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              <Icon name="save" className="text-sm" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
