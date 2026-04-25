import { useState, useEffect } from "react";
import { store } from "@/lib/store";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useList } from "@/lib/store";
import {
  motion,
  AnimatePresence,
  PageTransition,
  fadeInUp,
  slideInRight,
} from "@/components/ui/motion";
import { generateReportPdf, downloadPdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/currency";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";

const emptyItem = { name: "", sku: "", qty: 1, unitPrice: 0 };

export default function PurchaseInvoice() {
  const { list: invoices, add: addInvoice, update: updateInvoice } = useList("purchaseInvoices");
  const { list: vendors } = useList("vendors");
  const toast = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    Promise.all([api.getPurchaseInvoices(), api.getVendors()])
      .then(([inv, vend]) => {
        const listInv = Array.isArray(inv) ? inv : [];
        store.set("purchaseInvoices", listInv);
        store.set("vendors", Array.isArray(vend) ? vend : []);
        if (listInv.length) setSelectedInvoice(listInv[0]);
      })
      .catch(() => toast("Could not load purchase data from API", "error"));
  }, []);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPo, setNewPo] = useState({
    vendor: "",
    items: [{ ...emptyItem }],
  });

  const addItemRow = () => {
    setNewPo((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));
  };

  const updateItemRow = (idx, field, value) => {
    setNewPo((p) => ({
      ...p,
      items: p.items.map((item, i) =>
        i === idx ? { ...item, [field]: field === "qty" || field === "unitPrice" ? Number(value) : value } : item
      ),
    }));
  };

  const removeItemRow = (idx) => {
    setNewPo((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  const handleCreatePo = () => {
    if (!newPo.vendor) {
      toast("Please select a vendor", "warning");
      return;
    }
    if (newPo.items.some((i) => !i.name || i.qty <= 0)) {
      toast("Please fill all item rows", "warning");
      return;
    }

    const items = newPo.items.map((i) => ({
      ...i,
      total: i.qty * i.unitPrice,
    }));
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const tax = subtotal * 0.13;
    const total = subtotal + tax;
    const id = `PO-2024-${String(invoices.length + 1).padStart(3, "0")}`;

    const po = {
      id,
      vendor: newPo.vendor,
      date: new Date().toISOString().split("T")[0],
      status: "Pending",
      items,
      subtotal,
      tax,
      total,
    };

    addInvoice(po);
    setSelectedInvoice(po);
    setShowNewModal(false);
    setNewPo({ vendor: "", items: [{ ...emptyItem }] });
    toast(`Purchase order ${id} created`, "success");
  };

  const handleApprove = () => {
    if (!selectedInvoice) return;
    updateInvoice(selectedInvoice.id, { status: "Completed" });
    setSelectedInvoice((prev) => ({ ...prev, status: "Completed" }));
    toast(`${selectedInvoice.id} approved`, "success");
  };

  const handleExportPdf = () => {
    if (!selectedInvoice) return;
    try {
      const doc = generateReportPdf(
        `Purchase Order — ${selectedInvoice.id}`,
        ["Item", "SKU", "Qty", "Unit Price", "Total"],
        selectedInvoice.items.map((i) => [
          i.name,
          i.sku,
          i.qty.toString(),
          formatCurrency(i.unitPrice),
          formatCurrency(i.total),
        ])
      );
      downloadPdf(doc, `${selectedInvoice.id}.pdf`);
      toast("PDF downloaded", "success");
    } catch {
      toast("Failed to export PDF", "error");
    }
  };

  return (
    <PageTransition className="space-y-10">
      <motion.section
        className="flex flex-col md:flex-row justify-between md:items-end items-start gap-4"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
            Purchase Invoices
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Dynamic stock entry flow and purchase order management.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowNewModal(true)}>
          <Icon name="add" className="text-sm" />
          New Purchase Order
        </Button>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Invoice List */}
        <div className="lg:col-span-4 space-y-4">
          <AnimatePresence>
            {invoices.map((inv) => (
              <motion.div
                key={inv.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => setSelectedInvoice(inv)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedInvoice?.id === inv.id
                    ? "border-secondary bg-secondary-container/20"
                    : "border-surface-container-low dark:border-neutral-800 bg-surface-container-lowest dark:bg-[#1C1C1C] hover:border-outline-variant"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-bold text-sm text-on-surface dark:text-neutral-200">{inv.id}</p>
                    <p className="text-on-surface-variant dark:text-neutral-400 text-xs mt-1">{inv.vendor}</p>
                  </div>
                  <Badge variant={inv.status === "Completed" ? "success" : "warning"}>
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-end mt-3">
                  <span className="text-xs text-on-surface-variant dark:text-neutral-500">{inv.date}</span>
                  <span className="font-extrabold text-on-surface dark:text-white">{formatCurrency(inv.total)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Invoice Detail */}
        <AnimatePresence mode="wait">
          {selectedInvoice && (
            <motion.div
              key={selectedInvoice.id}
              className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-2xl p-6 md:p-10 border border-surface-container-low dark:border-neutral-800/50 shadow-xl shadow-black/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold font-headline text-on-surface dark:text-white">{selectedInvoice.id}</h2>
                  <p className="text-on-surface-variant dark:text-neutral-400 mt-1">
                    Vendor: <span className="font-semibold text-on-surface dark:text-neutral-200">{selectedInvoice.vendor}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={handleExportPdf}>
                    <Icon name="picture_as_pdf" className="text-sm" /> PDF
                  </Button>
                  {selectedInvoice.status !== "Completed" && (
                    <Button variant="secondary" size="sm" onClick={handleApprove}>
                      <Icon name="check" className="text-sm" /> Approve
                    </Button>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <tr className="border-b border-surface-container dark:border-neutral-800">
                    <TableHead className="px-4">Item</TableHead>
                    <TableHead className="px-4">SKU</TableHead>
                    <TableHead className="px-4 text-right">Qty</TableHead>
                    <TableHead className="px-4 text-right">Unit Price</TableHead>
                    <TableHead className="px-4 text-right">Total</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="px-4 font-semibold text-on-surface dark:text-neutral-200">{item.name}</TableCell>
                      <TableCell className="px-4 font-mono text-on-surface-variant dark:text-neutral-400">{item.sku}</TableCell>
                      <TableCell className="px-4 text-right text-on-surface dark:text-neutral-200">{item.qty}</TableCell>
                      <TableCell className="px-4 text-right text-on-surface dark:text-neutral-200">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="px-4 text-right font-bold text-on-surface dark:text-neutral-100">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 pt-6 border-t border-surface-container dark:border-neutral-800 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant dark:text-neutral-400">Subtotal</span>
                  <span className="font-semibold text-on-surface dark:text-neutral-200">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant dark:text-neutral-400">VAT (13%)</span>
                  <span className="font-semibold text-on-surface dark:text-neutral-200">{formatCurrency(selectedInvoice.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-surface-container dark:border-neutral-800 text-on-surface dark:text-white">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New PO Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Purchase Order"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2 block">
              Vendor *
            </label>
            <Combobox
              options={vendors.map((v) => ({ label: v.name, value: v.name }))}
              value={newPo.vendor}
              onChange={(val) => setNewPo((p) => ({ ...p, vendor: val }))}
              placeholder="Search or select vendor..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Line Items
              </label>
              <Button variant="ghost" size="sm" onClick={addItemRow}>
                <Icon name="add" className="text-sm" /> Add Row
              </Button>
            </div>
            <div className="space-y-3">
              {newPo.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItemRow(idx, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="SKU"
                      value={item.sku}
                      onChange={(e) => updateItemRow(idx, "sku", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => updateItemRow(idx, "qty", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItemRow(idx, "unitPrice", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm font-bold py-2">
                    {formatCurrency(item.qty * item.unitPrice)}
                  </div>
                  <div className="col-span-1 text-center">
                    {newPo.items.length > 1 && (
                      <button
                        onClick={() => removeItemRow(idx)}
                        className="text-error hover:text-error-dim transition-colors"
                      >
                        <Icon name="delete" className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-container dark:border-neutral-800">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleCreatePo}>
              <Icon name="check" className="text-sm" />
              Create Purchase Order
            </Button>
          </div>
        </div>
      </Modal>

      <motion.button
        className="fixed bottom-8 right-8 w-14 h-14 bg-secondary hover:bg-secondary-dim text-white rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNewModal(true)}
      >
        <Icon name="add" className="text-2xl" />
      </motion.button>
    </PageTransition>
  );
}
         