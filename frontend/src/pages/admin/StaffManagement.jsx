import { useState, useEffect } from "react";
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

const emptyForm = {
  name: "",
  role: "",
  department: "",
  email: "",
  status: "Active",
  joinDate: new Date().toISOString().slice(0, 10),
};

const STATUS_OPTIONS = ["Active", "On Leave", "Inactive"];
const FILTER_OPTIONS = ["All", ...STATUS_OPTIONS];

const statusVariant = (status) =>
  ({ Active: "success", "On Leave": "warning", Inactive: "neutral" })[status] ?? "neutral";

export default function StaffManagement() {
  const { list: staff } = useList("staffMembers");
  const toast = useToast();

  const reload = async () => {
    try {
      const rows = await api.getStaff();
      store.set("staffMembers", Array.isArray(rows) ? rows : []);
    } catch {
      toast("Could not load staff from API", "error");
    }
  };

  useEffect(() => { reload(); }, []);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "All" || s.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name,
      role: member.role,
      department: member.department,
      email: member.email,
      status: member.status,
      joinDate: member.joinDate,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Name and email are required", "error");
      return;
    }
    try {
      if (editing) {
        await api.updateStaff(editing.entityId, {
          fullName: form.name.trim(),
          email: form.email.trim(),
          positionTitle: form.role || null,
          department: form.department || null,
          isActive: form.status === "Active",
        });
        toast(`${form.name} updated successfully`, "success");
      } else {
        await api.createStaff({
          fullName: form.name.trim(),
          email: form.email.trim(),
          password: "Precision@123",
          positionTitle: form.role || null,
          department: form.department || null,
        });
        toast(`${form.name} added to staff`, "success");
      }
      await reload();
      setModalOpen(false);
    } catch (err) {
      toast(err.message || "Could not save staff member", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteStaff(deleteTarget.entityId);
      await reload();
      toast(`${deleteTarget.name} removed from staff`, "success");
      setDeleteTarget(null);
    } catch {
      toast("Could not remove staff member", "error");
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PageTransition>
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
            Staff Management
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Manage team roles, track status, and control access.
          </p>
        </div>
        <Button variant="secondary" onClick={openAdd}>
          <Icon name="person_add" className="text-sm" />
          Add New Staff
        </Button>
      </section>

      {/* Filters */}
      <div className="flex items-center gap-4 mt-8">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              placeholder="Search staff by name, role, or department..."
            />
          </div>
        </div>
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-colors ${
                activeFilter === filter
                  ? "bg-secondary text-white"
                  : "bg-surface-container-low dark:bg-neutral-800 text-on-surface-variant dark:text-neutral-400 hover:bg-surface-container dark:hover:bg-neutral-700"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-hidden border border-surface-container-low dark:border-neutral-800/50 mt-6">
        <Table>
          <TableHeader>
            <tr className="bg-surface-container-low/50 dark:bg-neutral-900/50 border-b border-surface-container dark:border-neutral-800">
              <TableHead className="px-6">Name</TableHead>
              <TableHead className="px-6">Role</TableHead>
              <TableHead className="px-6">Department</TableHead>
              <TableHead className="px-6">Email</TableHead>
              <TableHead className="px-6">Status</TableHead>
              <TableHead className="px-6 text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.map((member, i) => (
                <motion.tr
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, x: -20 }}
                  className="border-b border-surface-container-low/50 dark:border-neutral-800/30 hover:bg-surface-container-low/30 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <TableCell className="px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-on-surface-variant dark:text-neutral-300">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-semibold text-on-surface dark:text-neutral-200">
                        {member.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 text-on-surface-variant dark:text-neutral-400">
                    {member.role}
                  </TableCell>
                  <TableCell className="px-6 text-on-surface-variant dark:text-neutral-400">
                    {member.department}
                  </TableCell>
                  <TableCell className="px-6 text-on-surface-variant dark:text-neutral-400 font-mono text-xs">
                    {member.email}
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-surface-container-low dark:hover:bg-neutral-800 hover:text-on-surface dark:hover:text-white transition-colors"
                      >
                        <Icon name="edit" className="text-base" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(member)}
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
        {filtered.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant dark:text-neutral-500">
            <Icon name="search_off" className="text-4xl mb-2" />
            <p className="text-sm font-medium">No staff members found</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Staff Member" : "Add New Staff"}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Name</label>
            <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Role</label>
              <Input value={form.role} onChange={(e) => setField("role", e.target.value)} placeholder="e.g. Senior Technician" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Department</label>
              <Input value={form.department} onChange={(e) => setField("department", e.target.value)} placeholder="e.g. Engineering" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Email</label>
            <Input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@precision.com" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full rounded-lg border border-surface-container dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-on-surface dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Join Date</label>
              <Input type="date" value={form.joinDate} onChange={(e) => setField("joinDate", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleSave}>
              <Icon name={editing ? "save" : "person_add"} className="text-sm" />
              {editing ? "Save Changes" : "Add Staff"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <p className="text-on-surface-variant dark:text-neutral-400 mb-6">
          Are you sure you want to remove <strong className="text-on-surface dark:text-neutral-200">{deleteTarget?.name}</strong> from the staff roster? This action cannot be undone.
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
         