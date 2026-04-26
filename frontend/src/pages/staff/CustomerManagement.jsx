import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  motion,
  AnimatePresence,
  PageTransition,
  StaggerList,
  FadeInItem,
  fadeInUp,
  staggerContainer,
} from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const emptyCustomer = {
  name: "",
  type: "Individual",
  email: "",
  phone: "",
  status: "Active",
  totalSpent: "$0",
  loyaltyTier: "Bronze",
  vehicles: [],
  credit: 0,
  lastOrder: new Date().toISOString().split("T")[0],
};

const TYPES = ["Business", "Individual"];
const STATUSES = ["Active", "Inactive", "Credit Overdue"];
const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];
const FILTER_CHIPS = ["All", "Business", "Individual", "Active", "Credit Overdue", "Inactive"];

function statusVariant(status) {
  return { Active: "success", "Credit Overdue": "error", Inactive: "neutral" }[status] || "neutral";
}

function tierColor(tier) {
  return {
    Platinum: "text-violet-500",
    Gold: "text-amber-500",
    Silver: "text-slate-400",
    Bronze: "text-orange-400",
  }[tier] || "text-on-surface-variant";
}

export default function CustomerManagement() {
  const { list: customers } = useList("customers");
  const toast = useToast();

  const reload = async () => {
    try {
      const rows = await api.getCustomers();
      store.set("customers", Array.isArray(rows) ? rows : []);
    } catch {
      toast("Could not load customers from API", "error");
    }
  };

  useEffect(() => { reload(); }, []);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({ ...emptyCustomer });
  const [vehicleInput, setVehicleInput] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && String(c.phone).toLowerCase().includes(q)) ||
        String(c.id).includes(q) ||
        (Array.isArray(c.vehicles) &&
          c.vehicles.some((v) => String(v).toLowerCase().includes(q)));
      if (!matchesSearch) return false;
      if (activeFilter === "All") return true;
      if (activeFilter === "Business" || activeFilter === "Individual") return c.type === activeFilter;
      if (activeFilter === "Active" || activeFilter === "Credit Overdue" || activeFilter === "Inactive")
        return c.status === activeFilter;
      return true;
    });
  }, [customers, search, activeFilter]);


  function openNewModal() {
    setEditingCustomer(null);
    setForm({ ...emptyCustomer });
    setVehicleInput("");
    setModalOpen(true);
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setForm({ ...customer });
    setVehicleInput("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Please fill in name and email", "error");
      return;
    }
    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, {
          fullName: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || null,
          customerType: form.type,
          status: form.status,
          loyaltyTier: form.loyaltyTier,
          creditBalance: Number(form.credit) || 0,
        });
        toast(`${form.name} updated successfully`, "success");
      } else {
        await api.createCustomer({
          fullName: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || null,
          customerType: form.type,
          password: "Customer@123",
        });
        toast(`${form.name} added to customers`, "success");
      }
      await reload();
      setModalOpen(false);
    } catch (err) {
      toast(err.message || "Could not save customer", "error");
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await api.deleteCustomer(deleteModal.id);
      await reload();
      toast(`${deleteModal.name} has been removed`, "warning");
      setDeleteModal(null);
    } catch {
      toast("Could not delete customer", "error");
    }
  }

  function addVehicle() {
    if (!vehicleInput.trim()) return;
    setForm((f) => ({ ...f, vehicles: [...f.vehicles, vehicleInput.trim()] }));
    setVehicleInput("");
  }

  function removeVehicle(idx) {
    setForm((f) => ({ ...f, vehicles: f.vehicles.filter((_, i) => i !== idx) }));
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline">
              Customer Directory
            </h1>
            <p className="text-on-surface-variant dark:text-zinc-500 mt-1">
              Searchable CRM with vehicle linking and purchase history.
            </p>
          </div>
          <Button variant="secondary" onClick={openNewModal}>
            <Icon name="person_add" className="text-sm" />
            New Customer
          </Button>
        </section>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px] max-w-md">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                placeholder="Search customers by name or email..."
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_CHIPS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-colors",
                  activeFilter === filter
                    ? "bg-secondary text-white"
                    : "bg-surface-container-low dark:bg-zinc-800 text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container dark:hover:bg-zinc-700"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-surface-container-low dark:border-zinc-800">
          <Table>
            <TableHeader>
              <tr className="bg-surface-container-low/50 dark:bg-zinc-800/50 border-b border-surface-container dark:border-zinc-800">
                <TableHead className="px-6">Customer</TableHead>
                <TableHead className="px-6">Type</TableHead>
                <TableHead className="px-6">Total Spent</TableHead>
                <TableHead className="px-6">Loyalty</TableHead>
                <TableHead className="px-6">Vehicles</TableHead>
                <TableHead className="px-6">Status</TableHead>
                <TableHead className="px-6 text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="border-b border-surface-container dark:border-zinc-800 last:border-0"
                  >
                    <TableCell className="px-6">
                      <Link to={`/admin/customers/${customer.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-zinc-300">
                          {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface dark:text-zinc-200 hover:text-secondary transition-colors">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant dark:text-zinc-500">{customer.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge variant={customer.type === "Business" ? "info" : "neutral"}>
                        {customer.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 font-bold">{customer.totalSpent}</TableCell>
                    <TableCell className="px-6">
                      <span className={`text-xs font-bold uppercase ${tierColor(customer.loyaltyTier)}`}>
                        {customer.loyaltyTier}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 text-on-surface-variant dark:text-zinc-400 text-xs">
                      {customer.vehicles?.length > 0 ? customer.vehicles.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="px-6">
                      <Badge variant={statusVariant(customer.status)}>{customer.status}</Badge>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-zinc-800 hover:text-secondary transition-colors"
                          title="Edit"
                        >
                          <Icon name="edit" className="text-base" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(customer)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-error transition-colors"
                          title="Delete"
                        >
                          <Icon name="delete" className="text-base" />
                        </button>
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-zinc-800 hover:text-on-surface transition-colors"
                          title="View Profile"
                        >
                          <Icon name="open_in_new" className="text-base" />
                        </Link>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <Icon name="search_off" className="text-4xl opacity-30" />
              <p className="text-sm mt-2">No customers match your search.</p>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingCustomer ? "Edit Customer" : "New Customer"}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                  Full Name *
                </label>
                <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Customer name" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                  Email *
                </label>
                <Input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                  Phone
                </label>
                <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+1 555 000 0000" />
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
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1 block">
                  Credit ($)
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
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVehicle())}
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
                      {v}
                      <button onClick={() => removeVehicle(i)} className="text-on-surface-variant hover:text-error">
                        <Icon name="close" className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={handleSave}>
                <Icon name={editingCustomer ? "save" : "person_add"} className="text-sm" />
                {editingCustomer ? "Save Changes" : "Add Customer"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Confirm Deletion"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to delete{" "}
              <span className="font-bold text-on-surface">{deleteModal?.name}</span>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Icon name="delete" className="text-sm" />
                Delete Customer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
                                            