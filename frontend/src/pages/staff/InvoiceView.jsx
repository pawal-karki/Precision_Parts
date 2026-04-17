import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { generateInvoicePdf, downloadPdf, printPdf } from "@/lib/pdf";
import { motion, PageTransition } from "@/components/ui/motion";
import { formatCurrency } from "@/lib/currency";

export default function InvoiceView() {
  const toast = useToast();
  const [invoice, setInvoice] = useState(() => store.get("lastInvoice") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const last = store.get("lastInvoice");
    if (last) {
      setInvoice(last);
      setLoading(false);
      return;
    }
    api
      .getInvoice()
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(() => {
        toast("Could not load invoice from API", "error");
        setLoading(false);
      });
  }, []);

  function handlePrint() {
    if (!invoice) return;
    try {
      const doc = generateInvoicePdf(invoice);
      printPdf(doc);
      toast("Print dialog opened", "info");
    } catch {
      toast("Failed to generate print preview", "error");
    }
  }

  function handleDownload() {
    if (!invoice) return;
    try {
      const doc = generateInvoicePdf(invoice);
      downloadPdf(doc, `invoice-${invoice.id}.pdf`);
      toast(`Downloaded invoice-${invoice.id}.pdf`, "success");
    } catch {
      toast("Failed to generate PDF", "error");
    }
  }

  if (loading || !invoice) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[40vh] text-on-surface-variant">
          {loading ? "Loading invoice…" : "No invoice data."}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Print Header */}
        <div className="flex justify-between items-center print:hidden">
          <h1 className="text-3xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline">
            Invoice
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Icon name="print" className="text-sm" />
              Print
            </Button>
            <Button variant="secondary" onClick={handleDownload}>
              <Icon name="download" className="text-sm" />
              Download PDF
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-surface-container-low dark:border-zinc-800 p-8 max-w-3xl mx-auto shadow-sm"
        >
          <div className="flex justify-between items-start border-b border-surface-container pb-6 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Invoice</p>
              <p className="text-2xl font-headline font-bold text-on-surface dark:text-white mt-1">{invoice.id}</p>
              <p className="text-sm text-on-surface-variant mt-2">{invoice.date}</p>
            </div>
            <div className="text-right text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface dark:text-white">{invoice.company?.name}</p>
              <p className="whitespace-pre-line mt-1">{invoice.company?.address}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Bill To</p>
              <p className="font-semibold text-on-surface dark:text-white">{invoice.customer?.name}</p>
              <p className="whitespace-pre-line text-on-surface-variant mt-1">{invoice.customer?.address}</p>
              <p className="text-on-surface-variant mt-1">{invoice.customer?.email}</p>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Due</p>
              <p className="font-medium text-on-surface dark:text-white">{invoice.dueDate}</p>
            </div>
          </div>

          <div className="border border-surface-container-low dark:border-zinc-800 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low/80 dark:bg-zinc-800/80">
                <tr>
                  <th className="text-left p-3 font-semibold">Item</th>
                  <th className="text-left p-3 font-semibold">SKU</th>
                  <th className="text-right p-3 font-semibold">Qty</th>
                  <th className="text-right p-3 font-semibold">Price</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} className="border-t border-surface-container-low dark:border-zinc-800">
                    <td className="p-3 font-medium text-on-surface dark:text-zinc-100">{item.name}</td>
                    <td className="p-3 font-mono text-on-surface-variant">{item.sku}</td>
                    <td className="p-3 text-right">{item.qty}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.loyaltyApplied ? (
                <div className="flex justify-between text-emerald-600">
                  <span>Loyalty</span>
                  <span>-{formatCurrency(invoice.loyaltyDiscount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Tax</span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-surface-container pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
       