import { useState, useEffect, useCallback } from "react";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  motion,
  AnimatePresence,
  PageTransition,
  fadeInUp,
  slideInRight,
  staggerContainer,
} from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { Combobox } from "@/components/ui/combobox";

const emptyForm = {
  name: "",
  sku: "",
  batch: "",
  stock: 0,
  unit: "pcs",
  category: "",
  price: 0,
  vendor: "",
  minStock: 10,
  location: "",
};

function calcStatus(stock, minStock) {
  if (stock < 10) return "Critical";
  if (stock < minStock) return "Low Stock";
  return "In Stock";
}

const statusVariant = (status) =>
  ({ "In Stock": "success", "Low Stock": "warning", Critical: "error", Refilling: "neutral" })[status] ?? "neutral";

export default function PartsManagement() {
  const { list: parts } = useList("partsInventory");
  const { list: vendors } = useList("vendors");
  const toast = useToast();

  const reloadParts = useCallback(() => {
    return Promise.all([api.getParts(), api.getVendors()])
      .then(([rows, vends]) => {
        store.set("partsInventory", Array.isArray(rows) ? rows : []);
        store.set("vendors", Array.isArray(vends) ? vends : []);
      })
      .catch(() => {
        toast("Could not load inventory data", "error");
      });
  }, [toast]);

  useEffect(() => {
    reloadParts().then(() => {
      // Handle deep link from notifications
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const part = store.get("partsInventory")?.find(p => p.sku === hash || p.name.includes(hash));
        if (part) {
          openPanel(part);
          toast(`Inspecting component: ${part.name}`, "info");
        }
      }
    });
  }, [reloadParts]);

  const [search, setSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingInPanel, setEditingInPanel] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: parts.length,
    inStock: parts.filter((p) => calcStatus(p.stock, p.minStock) === "In Stock").length,
    lowStock: parts.filter((p) => calcStatus(p.stock, p.minStock) === "Low Stock").length,
    critical: parts.filter((p) => calcStatus(p.stock, p.minStock) === "Critical").length,
  };

  const openAdd = () => {
    setForm(emptyForm);
    setAddModalOpen(true);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast("Name and SKU are required", "error");
      return;
    }
    try {
      await api.createPart({
        sku: form.sku.trim(),
        name: form.name.trim(),
        unitPrice: Number(form.price),
        stockQty: Number(form.stock),
        reorderLevel: Number(form.minStock),
        batchCode: form.batch || null,
        unitOfMeasure: form.unit || null,
        warehouseLocation: form.location || null,
        categoryId: null,
        vendorId: null,
      });
      await reloadParts();
      toast(`${form.name} added to inventory`, "success");
      setAddModalOpen(false);
    } catch {
      toast("Could not create part on server", "error");
    }
  };

  const openPanel = (part) => {
    setSelectedPart(part);
    setEditingInPanel(false);
  };

  const startPanelEdit = () => {
    if (!selectedPart) return;
    setForm({
      name: selectedPart.name,
      sku: selectedPart.sku,
      batch: selectedPart.batch,
      stock: selectedPart.stock,
      unit: selectedPart.unit,
      category: selectedPart.category,
      price: selectedPart.price,
      vendor: selectedPart.vendor,
      minStock: selectedPart.minStock,
      location: selectedPart.location,
    });
    setEditingInPanel(true);
  };

  const savePanelEdit = async () => {
    if (!selectedPart?.entityId) return;
    const stock = Number(form.stock);
    const minStock = Number(form.minStock);
    try {
      await api.updatePart(selectedPart.entityId, {
        sku: form.sku.trim(),
        name: form.name.trim(),
        stockQty: stock,
        reorderLevel: minStock,
        unitPrice: Number(form.price),
        batchCode: form.batch || null,
        unitOfMeasure: form.unit || null,
        warehouseLocation: form.location || null,
      });
      await reloadParts();
      const status = calcStatus(stock, minStock);
      const updates = { ...form, stock, price: Number(form.price), minStock, status };
      setSelectedPart({ ...selectedPart, ...updates, id: selectedPart.id });
      setEditingInPanel(false);
      toast(`${form.name} updated`, "success");
    } catch {
      toast("Could not update part on server", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.entityId) return;
    try {
      await api.deletePart(deleteTarget.entityId);
      await reloadParts();
      if (selectedPart?.id === deleteTarget.id) setSelectedPart(null);
      toast(`${deleteTarget.name} removed from inventory`, "success");
      setDeleteTarget(null);
    } catch {
      toast("Could not delete part on server", "error");
    }
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PageTransition>
      <div className="relative h-[calc(100vh-8rem)] overflow-hidden -m-8">
        <div className="flex h-full">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-8">
            <section className="flex flex-col md:flex-row justify-between md:items-end items-start gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
                  Parts Management
                </h1>
                <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
                  Master inventory list with real-time stock indicators.
                </p>
              </div>
              <Button variant="secondary" onClick={openAdd}>
                <Icon name="add" className="text-sm" />
                Add Part
              </Button>
            </section>

            {/* Stats Bar */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { label: "Total SKUs", value: stats.total, color: "" },
                { label: "In Stock", value: stats.inStock, color: "text-emerald-600" },
                { label: "Low Stock", value: stats.lowStock, color: "text-amber-500" },
                { label: "Critical", value: stats.critical, color: "text-error" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-4 dark:border dark:border-neutral-800/50"
                >
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{stat.label}</p>
                  <p className={`text-2xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  placeholder="Search parts by name or SKU..."
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-xl overflow-x-auto border border-surface-container-low dark:border-neutral-800/50">
              <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <tr className="bg-surface-container-low/50 dark:bg-neutral-900/50 border-b border-surface-container dark:border-neutral-800">
                    <TableHead className="px-6">Component</TableHead>
                    <TableHead className="px-6">SKU</TableHead>
                    <TableHead className="px-6">Batch</TableHead>
                    <TableHead className="px-6">Stock</TableHead>
                    <TableHead className="px-6">Status</TableHead>
                    <TableHead className="px-6 text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((part, i) => {
                      const status = calcStatus(part.stock, part.minStock);
                      return (
                        <motion.tr
                          key={part.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`cursor-pointer border-b border-surface-container-low/50 dark:border-neutral-800/30 hover:bg-surface-container-low/30 dark:hover:bg-neutral-800/30 transition-colors ${
                            selectedPart?.id === part.id ? "bg-surface-container-low/50 dark:bg-neutral-800/50" : ""
                          }`}
                          onClick={() => openPanel(part)}
                        >
                          <TableCell className="px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-surface-container-high dark:bg-neutral-800 flex items-center justify-center">
                                <Icon name="settings_input_component" className="text-xs text-on-surface-variant dark:text-neutral-400" />
                              </div>
                              <span className="font-semibold text-on-surface dark:text-neutral-200">{part.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 font-mono text-on-surface-variant dark:text-neutral-500">{part.sku}</TableCell>
                          <TableCell className="px-6 font-mono text-on-surface-variant dark:text-neutral-500">{part.batch}</TableCell>
                          <TableCell className="px-6">
                            <span className="font-semibold text-on-surface dark:text-neutral-200">
                              {part.stock.toLocaleString()}{" "}
                              <span className="text-[10px] text-on-surface-variant dark:text-neutral-500">{part.unit}</span>
                            </span>
                          </TableCell>
                          <TableCell className="px-6">
                            <Badge variant={statusVariant(status)}>{status}</Badge>
                          </TableCell>
                          <TableCell className="px-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(part);
                              }}
                              className="p-1.5 rounded-lg text-on-surface-variant dark:text-neutral-500 hover:bg-error/10 hover:text-error transition-colors"
                            >
                              <Icon name="delete" className="text-base" />
                            </button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-on-surface-variant dark:text-neutral-500">
                  <Icon name="search_off" className="text-4xl mb-2" />
                  <p className="text-sm font-medium">No parts found</p>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Slide-over Detail Panel */}
          <AnimatePresence>
            {selectedPart && (
              <motion.div
                key="panel"
                variants={slideInRight}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-[420px] bg-white dark:bg-neutral-900 border-l border-surface-container dark:border-neutral-800 shadow-[-20px_0_60px_rgba(45,52,50,0.08)] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl p-6 border-b border-surface-container dark:border-neutral-800 flex justify-between items-center z-10">
                  <h3 className="text-lg font-bold font-headline">{selectedPart.name}</h3>
                  <button
                    onClick={() => { setSelectedPart(null); setEditingInPanel(false); }}
                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <Icon name="close" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-surface-container-low dark:bg-neutral-800 rounded-xl p-4 flex items-center justify-center h-48">
                    <Icon name="inventory_2" className="text-6xl text-on-surface-variant/30" />
                  </div>

                  {editingInPanel ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Name</label>
                          <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">SKU</label>
                          <Input value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Batch</label>
                          <Input value={form.batch} onChange={(e) => setField("batch", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Category</label>
                          <Input value={form.category} onChange={(e) => setField("category", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Stock</label>
                          <Input type="number" value={form.stock} onChange={(e) => setField("stock", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Min Stock</label>
                          <Input type="number" value={form.minStock} onChange={(e) => setField("minStock", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Unit</label>
                          <Input value={form.unit} onChange={(e) => setField("unit", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Price (Rs.)</label>
                          <Input type="number" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Vendor</label>
                          <Combobox
                            options={vendors.map(v => ({ label: v.name, value: v.name }))}
                            value={form.vendor}
                            onChange={(val) => setField("vendor", val)}
                            placeholder="Select vendor..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Location</label>
                        <Input value={form.location} onChange={(e) => setField("location", e.target.value)} />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={savePanelEdit}>
                          <Icon name="save" className="text-sm" /> Save
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={() => setEditingInPanel(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "SKU", value: selectedPart.sku, mono: true },
                          { label: "Batch", value: selectedPart.batch, mono: true },
                          { label: "Category", value: selectedPart.category },
                          { label: "Price", value: formatCurrency(selectedPart.price) },
                          { label: "Stock", value: `${selectedPart.stock.toLocaleString()} ${selectedPart.unit}` },
                          { label: "Min Stock", value: selectedPart.minStock },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">{item.label}</p>
                            <p className={`font-semibold mt-1 ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Vendor</p>
                        <p className="font-semibold mt-1">{selectedPart.vendor}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Location</p>
                        <p className="font-semibold mt-1">{selectedPart.location}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">Status</p>
                        <Badge variant={statusVariant(calcStatus(selectedPart.stock, selectedPart.minStock))}>
                          {calcStatus(selectedPart.stock, selectedPart.minStock)}
                        </Badge>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={startPanelEdit}>
                          <Icon name="edit" className="text-sm" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setDeleteTarget(selectedPart);
                          }}
                        >
                          <Icon name="delete" className="text-sm" /> Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Part Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Part"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Name</label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Part name" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">SKU</label>
              <Input value={form.sku} onChange={(e) => setField("sku", e.target.value)} placeholder="e.g. VC-9921-T" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Batch</label>
              <Input value={form.batch} onChange={(e) => setField("batch", e.target.value)} placeholder="e.g. B02-24" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Category</label>
              <Input value={form.category} onChange={(e) => setField("category", e.target.value)} placeholder="e.g. Engine" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Unit</label>
              <Input value={form.unit} onChange={(e) => setField("unit", e.target.value)} placeholder="pcs / liters" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Stock</label>
              <Input type="number" value={form.stock} onChange={(e) => setField("stock", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Min Stock</label>
              <Input type="number" value={form.minStock} onChange={(e) => setField("minStock", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Price (Rs.)</label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Vendor</label>
              <Combobox
                options={vendors.map(v => ({ label: v.name, value: v.name }))}
                value={form.vendor}
                onChange={(val) => setField("vendor", val)}
                placeholder="Search vendor..."
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Location</label>
              <Input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Warehouse A, Row 2" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleAdd}>
              <Icon name="add" className="text-sm" />
              Add Part
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
          Are you sure you want to delete <strong className="text-on-surface dark:text-neutral-200">{deleteTarget?.name}</strong> ({deleteTarget?.sku}) from inventory?
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
             