import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  motion,
  AnimatePresence,
  PageTransition,
  fadeInUp,
  staggerContainer,
} from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";

const emptyForm = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  status: "Active",
  location: "",
  rating: 4.0,
  totalOrders: 0,
  totalSpend: "$0",
  lastOrder: new Date().toISOString().slice(0, 10),
};

const STATUS_OPTIONS = ["Active", "Under Review", "Inactive"];

export default function VendorManagement() {
  const { list: vendors } = useList("vendors");
  const toast = useToast();

  const reloadVendors = useCallback(() => {
    return api
      .getVendors()
      .then((rows) => store.set("vendors", Array.isArray(rows) ? rows : []))
      .catch(() => toast("Could not load vendors from API", "error"));
  }, [toast]);

  useEffect(() => {
    reloadVendors();
  }, [reloadVendors]);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contact.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (vendor) => {
    setEditing(vendor);
    setForm({
      name: vendor.name,
      contact: vendor.contact,
      email: vendor.email,
      phone: vendor.phone,
      status: vendor.status,
      location: vendor.location,
      rating: vendor.rating,
      totalOrders: vendor.totalOrders,
      totalSpend: vendor.totalSpend,
      lastOrder: vendor.lastOrder,
    });
    setModalOpen(true);
  };

  const parseLocation = () => {
    const p = (form.location || "").split(",").map((s) => s.trim());
    return { city: p[0] || null, country: p[1] || null };
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.contact.trim()) {
      toast("Vendor name and contact are required", "error");
      return;
    }
    const { city, country } = parseLocation();
    try {
      if (editing?.entityId) {
        await api.updateVendor(editing.entityId, {
          name: form.name.trim(),
          contactName: form.contact.trim(),
          email: form.email || null,
          phone: form.phone || null,
          city,
          country,
          rating: Number(form.rating),
          isActive: form.status === "Active" || form.status === "Under Review",
        });
      } else {
        await api.createVendor({
          name: form.name.trim(),
          contactName: form.contact.trim(),
          email: form.email || null,
          phone: form.phone || null,
          city,
          country,
          rating: Number(form.rating),
          isActive: form.status !== "Inactive",
        });
      }
      await reloadVendors();
      toast(`${form.name} saved`, "success");
      setModalOpen(false);
    } catch {
      toast("Could not save vendor on server", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.entityId) return;
    try {
      await api.deleteVendor(deleteTarget.entityId);
      await reloadVendors();
      toast(`${deleteTarget.name} removed`, "success");
      setDeleteTarget(null);
    } catch {
      toast("Could not delete vendor on server", "error");
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PageTransition className="space-y-10">
      <section className="flex flex-col md:flex-row justify-between md:items-end items-start gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
            Vendor Management
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Profiles, purchase history, and vendor contacts.
          </p>
        </div>
        <Button variant="secondary" onClick={openAdd}>
          <Icon name="add" className="text-sm" />
          Add Vendor
        </Button>
      </section>

      <div className="relative max-w-md mt-8">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          placeholder="Search vendors by name, contact, or location..."
        />
      </div>

      <div className="overflow-x-auto bg-white dark:bg-[#1C1C1C] rounded-xl border border-surface-container-low dark:border-neutral-800/50 mt-6 shadow-sm">
        <div className="min-w-[800px]">
          <Table>
          <TableHeader>
            <tr className="bg-surface-container-low/50 dark:bg-neutral-900/50 border-b border-surface-container dark:border-neutral-800">
              <TableHead className="px-6">Vendor</TableHead>
              <TableHead className="px-6">Contact</TableHead>
              <TableHead className="px-6">Location</TableHead>
              <TableHead className="px-6 hidden md:table-cell">Total Orders</TableHead>
              <TableHead className="px-6 hidden lg:table-cell">Total Spend</TableHead>
              <TableHead className="px-6">Rating</TableHead>
              <TableHead className="px-6">Status</TableHead>
              <TableHead className="px-6 text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((vendor, i) => (
                <motion.tr
                  key={vendor.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, x: -20 }}
                  className="border-b border-surface-container-low/50 dark:border-neutral-800/30 hover:bg-surface-container-low/30 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <TableCell className="px-6">
                    <Link
                      to={`/admin/vendors/${vendor.id}`}
                      className="font-semibold text-on-surface dark:text-neutral-200 hover:text-secondary transition-colors"
                    >
                      {vendor.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-6 text-on-surface-variant dark:text-neutral-400">
                    {vendor.contact || vendor.contactName || "—"}
                  </TableCell>
                  <TableCell className="px-6 text-on-surface-variant dark:text-neutral-400">
                    {vendor.location || [vendor.city, vendor.country].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="px-6 font-semibold hidden md:table-cell">{vendor.totalOrders || 0}</TableCell>
                  <TableCell className="px-6 font-semibold hidden lg:table-cell">{vendor.totalSpend || "Rs. 0"}</TableCell>
                  <TableCell className="px-6">
                    <div className="flex items-center gap-1">
                      <Icon name="star" filled className="text-amber-400 text-sm" />
                      <span className="font-semibold text-sm">{vendor.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant={(vendor.status === "Active" || vendor.isActive) ? "success" : vendor.status === "Under Review" ? "warning" : "neutral"}>
                      {vendor.status || (vendor.isActive ? "Active" : "Inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/vendors/${vendor.id}`}
                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-surface-container-low dark:hover:bg-neutral-800 hover:text-on-surface dark:hover:text-white transition-colors"
                      >
                        <Icon name="visibility" className="text-base" />
                      </Link>
                      <button
                        onClick={() => openEdit(vendor)}
                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-surface-container-low dark:hover:bg-neutral-800 hover:text-on-surface dark:hover:text-white transition-colors"
                      >
                        <Icon name="edit" className="text-base" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(vendor)}
                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-error/10 hover:text-error transition-colors"
                      >
                        <Icon name="delete" className="text-base" />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
    {filtered.length === 0 && (
      <div className="py-12 text-center text-on-surface-variant dark:text-neutral-500">
        <Icon name="search_off" className="text-4xl mb-2" />
        <p className="text-sm font-medium">No vendors found</p>
      </div>
    )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Vendor" : "Add New Vendor"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Vendor Name</label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Contact Person</label>
              <Input value={form.contact} onChange={(e) => setField("contact", e.target.value)} placeholder="Full name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="vendor@example.com" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Phone</label>
              <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+1 234 567 8900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Location</label>
              <Input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="City, Country" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Status</label>
              <Select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">
              Rating ({Number(form.rating).toFixed(1)})
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => setField("rating", e.target.value)}
              className="w-full accent-secondary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleSave}>
              <Icon name={editing ? "save" : "add"} className="text-sm" />
              {editing ? "Save Changes" : "Add Vendor"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <p className="text-on-surface-variant dark:text-neutral-400 mb-6">
          Are you sure you want to remove <strong className="text-on-surface dark:text-neutral-200">{deleteTarget?.name}</strong>? All associated data will be lost.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDelete}>
            <Icon name="delete" className="text-sm" />
            Delete
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
       