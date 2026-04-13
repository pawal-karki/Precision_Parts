import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { generateReportPdf, downloadPdf } from "@/lib/pdf";
import {
  motion,
  PageTransition,
  fadeInUp,
} from "@/components/ui/motion";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";

const purchaseHistory = [
  { po: "PO-2024-001", date: "Mar 10, 2024", items: "Titanium Valve Cap (500), Hub Bolt Kit (200)", amount: "$15,000.00" },
  { po: "PO-2023-048", date: "Dec 15, 2023", items: "Valve Cap (300), Seal Kit (100)", amount: "$8,250.00" },
  { po: "PO-2023-032", date: "Sep 22, 2023", items: "Titanium Valve Cap (400)", amount: "$8,800.00" },
];

export default function VendorProfile() {
  const { id } = useParams();
  const { list: vendors } = useList("vendors");
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getVendors()
      .then((rows) => store.set("vendors", Array.isArray(rows) ? rows : []))
      .catch(() => toast("Could not load vendors", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when vendor route changes
  }, [id]);

  const vendor = vendors.find((v) => v.id === Number(id));

  if (loading) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <Icon name="sync" className="text-4xl mb-2 animate-spin" />
        <p>Loading vendor…</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <Icon name="error" className="text-4xl mb-2" />
        <p>Vendor not found.</p>
        <Link to="/admin/vendors" className="text-secondary text-sm mt-2 inline-block">Back to Vendors</Link>
      </div>
    );
  }

  const handleExportHistory = () => {
    try {
      const doc = generateReportPdf(
        `${vendor.name} — Purchase History`,
        ["PO Number", "Date", "Items", "Amount"],
        purchaseHistory.map((r) => [r.po, r.date, r.items, r.amount])
      );
      downloadPdf(doc, `${vendor.name.replace(/\s+/g, "-")}-history.pdf`);
      toast("Purchase history exported as PDF", "success");
    } catch {
      toast("Failed to export", "error");
    }
  };

  return (
    <PageTransition>
      <Link
        to="/admin/vendors"
        className="flex items-center gap-1 text-sm text-secondary hover:text-secondary-dim transition-colors"
      >
        <Icon name="arrow_back" className="text-sm" />
        Back to Vendors
      </Link>

      <motion.div
        className="bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-8 border border-surface-container-low dark:border-neutral-800/50"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <motion.div
              className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Icon name="business" className="text-3xl text-secondary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-extrabold font-headline tracking-tight">{vendor.name}</h1>
              <p className="text-on-surface-variant mt-1">{vendor.location}</p>
              <Badge variant={vendor.status === "Active" ? "success" : "warning"} className="mt-2">
                {vendor.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExportHistory}>
              <Icon name="download" className="text-sm" /> Export PDF
            </Button>
            <Button variant="secondary" onClick={() => toast("Edit feature: use Vendor Management page", "info")}>
              <Icon name="edit" className="text-sm" /> Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mt-8">
          {[
            { label: "Total Orders", value: vendor.totalOrders },
            { label: "Total Spend", value: vendor.totalSpend },
            { label: "Rating", value: vendor.rating, showStar: true },
            { label: "Last Order", value: vendor.lastOrder },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-surface-container-low dark:bg-neutral-800 rounded-lg p-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{stat.label}</p>
              {stat.showStar ? (
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="star" filled className="text-amber-400" />
                  <span className="text-2xl font-extrabold">{stat.value}</span>
                </div>
              ) : (
                <p className="text-2xl font-extrabold mt-1">{stat.value}</p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-8">
        <motion.div
          className="col-span-4 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold font-headline mb-4">Contact Information</h3>
          <div className="space-y-4">
            {[
              { icon: "person", label: "Primary Contact", value: vendor.contact },
              { icon: "mail", label: "Email", value: vendor.email },
              { icon: "phone", label: "Phone", value: vendor.phone },
              { icon: "location_on", label: "Location", value: vendor.location },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <Icon name={item.icon} className="text-on-surface-variant" />
                <div>
                  <p className="text-xs text-on-surface-variant">{item.label}</p>
                  <p className="font-semibold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="col-span-8 bg-surface-container-lowest dark:bg-[#1C1C1C] rounded-xl p-6 border border-surface-container-low dark:border-neutral-800/50"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-lg font-bold font-headline mb-4">Recent Purchase History</h3>
          <Table>
            <TableHeader>
              <tr className="border-b border-surface-container dark:border-neutral-800">
                <TableHead>PO Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {purchaseHistory.map((row, i) => (
                <motion.tr
                  key={row.po}
                  className="group hover:bg-background dark:hover:bg-neutral-800/20 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                >
                  <TableCell className="font-mono font-bold text-secondary">{row.po}</TableCell>
                  <TableCell className="text-on-surface-variant">{row.date}</TableCell>
                  <TableCell>{row.items}</TableCell>
                  <TableCell className="text-right font-bold">{row.amount}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </PageTransition>
  );
}
            