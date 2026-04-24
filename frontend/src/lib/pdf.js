import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/currency";

export function generateInvoicePdf(invoice) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(77, 97, 114);
  doc.text("INVOICE", pageWidth - 20, 30, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(94, 94, 94);
  doc.text(invoice.id, pageWidth - 20, 38, { align: "right" });

  doc.setFontSize(14);
  doc.setTextColor(45, 52, 50);
  doc.text("Precision Parts", 20, 30);
  doc.setFontSize(9);
  doc.setTextColor(90, 96, 94);
  doc.text("Kathmandu, Nepal", 20, 36);
  doc.text("New Baneshwor, Kathmandu 44600", 20, 41);
  doc.text("accounts@precision-parts.com.np", 20, 46);

  doc.setDrawColor(236, 239, 236);
  doc.line(20, 55, pageWidth - 20, 55);

  doc.setFillColor(242, 244, 242);
  doc.rect(20, 60, pageWidth - 40, 25, "F");
  doc.setFontSize(8);
  doc.setTextColor(90, 96, 94);
  doc.text("BILL TO", 25, 67);
  doc.setFontSize(11);
  doc.setTextColor(45, 52, 50);
  doc.text(invoice.customer.name, 25, 74);
  doc.setFontSize(9);
  doc.setTextColor(90, 96, 94);
  doc.text(invoice.customer.email || "", 25, 80);

  doc.setFontSize(9);
  doc.text(`Date: ${invoice.date}`, pageWidth - 25, 67, { align: "right" });
  doc.text(`Due: ${invoice.dueDate}`, pageWidth - 25, 73, { align: "right" });

  autoTable(doc, {
    startY: 95,
    head: [["Item", "SKU", "Qty", "Unit Price", "Total"]],
    body: invoice.items.map((item) => [
      item.name,
      item.sku,
      item.qty.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.total),
    ]),
    theme: "plain",
    headStyles: {
      fillColor: [242, 244, 242],
      textColor: [90, 96, 94],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 9, textColor: [45, 52, 50] },
    columnStyles: {
      0: { cellWidth: 60 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  const rightX = pageWidth - 25;

  doc.setFontSize(9);
  doc.setTextColor(90, 96, 94);
  doc.text("Subtotal", rightX - 60, finalY);
  doc.setTextColor(45, 52, 50);
  doc.text(formatCurrency(invoice.subtotal), rightX, finalY, { align: "right" });

  if (invoice.loyaltyApplied) {
    doc.setTextColor(16, 185, 129);
    doc.text("Loyalty Discount (10%)", rightX - 60, finalY + 7);
    doc.text(`-${formatCurrency(invoice.loyaltyDiscount)}`, rightX, finalY + 7, { align: "right" });
  }

  const taxY = finalY + (invoice.loyaltyApplied ? 14 : 7);
  doc.setTextColor(90, 96, 94);
  doc.text("VAT (13%)", rightX - 60, taxY);
  doc.setTextColor(45, 52, 50);
  doc.text(formatCurrency(invoice.tax), rightX, taxY, { align: "right" });

  doc.setDrawColor(236, 239, 236);
  doc.line(rightX - 65, taxY + 4, rightX, taxY + 4);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total Due", rightX - 60, taxY + 12);
  doc.text(formatCurrency(invoice.total), rightX, taxY + 12, { align: "right" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Thank you for your business. Payment due within 30 days.",
    pageWidth / 2,
    280,
    { align: "center" }
  );
  doc.text(
    "Precision Parts • Kathmandu, Nepal",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  return doc;
}

export function generateReportPdf(title, columns, rows) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(45, 52, 50);
  doc.text(title, 20, 25);

  doc.setFontSize(9);
  doc.setTextColor(90, 96, 94);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 33);
  doc.text("Precision Atelier Industrial Inventory", pageWidth - 20, 33, { align: "right" });

  doc.setDrawColor(236, 239, 236);
  doc.line(20, 38, pageWidth - 20, 38);

  autoTable(doc, {
    startY: 45,
    head: [columns],
    body: rows,
    theme: "striped",
    headStyles: {
      fillColor: [77, 97, 114],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [45, 52, 50] },
    alternateRowStyles: { fillColor: [249, 249, 247] },
    margin: { left: 20, right: 20 },
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Precision Atelier System v4.2.0 • Confidential",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  return doc;
}

export function downloadPdf(doc, filename) {
  doc.save(filename);
}

export function printPdf(doc) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };
}
