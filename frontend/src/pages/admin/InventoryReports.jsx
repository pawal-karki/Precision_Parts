import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { useToast } from "@/components/ui/toast";
import {
  motion,
  PageTransition,
  StaggerList,
  FadeInItem,
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
import { api } from "@/lib/api";
import { generateReportPdf, downloadPdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/currency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InventoryReports() {
  const [report, setReport] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const toast = useToast();

  useEffect(() => {
    api.getInventoryReports().then(setReport);
  }, []);

  const filtered = categoryFilter
    ? report.filter((r) => r.category === categoryFilter)
    : report;

  const totalItems = filtered.reduce((s, r) => s + r.totalItems, 0);
  const totalValue = filtered.reduce((s, r) => s + parseAmt(r.value), 0);

  const parseAmt = (val) => typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ""));

  const handleExport = () => {
    try {
      const doc = generateReportPdf(
        "Inventory Report",
        ["Category", "Total Items", "Value", "Turnover Rate"],
        filtered.map((r) => [r.category, r.totalItems.toString(), formatCurrency(parseAmt(r.value)), r.turnover])
      );
      downloadPdf(doc, "inventory-report.pdf");
      toast("Inventory report exported as PDF", "success");
    } catch {
      toast("Failed to export report", "error");
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
            Inventory Reports
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Stock levels, category breakdowns, and turnover analytics.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-surface-container-low dark:bg-neutral-800 text-on-surface dark:text-neutral-300 rounded-lg px-4 py-2 text-sm font-medium border-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {report.map((r) => (
              <option key={r.category} value={r.category}>{r.category}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleExport}>
            <Icon name="download" className="text-sm" />
            Export PDF
          </Button>
        </div>
      </motion.section>

      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FadeInItem>
          <KpiCard icon="inventory_2" label="Total Items" value={totalItems.toLocaleString()} trend="+5.2%" trendType="up" />
        </FadeInItem>
        <FadeInItem>
          <KpiCard icon="attach_money" label="Total Value" value="Rs. 5,31,06,000" trend="+8.1%" trendType="up" />
        </FadeInItem>
        <FadeInItem>
          <KpiCard icon="swap_horiz" label="Avg Turnover" value="4.8x" trend="Healthy" trendType="neutral" />
        </FadeInItem>
        <FadeInItem>
          <KpiCard icon="warning" label="Below Minimum" value="3" trend="Action Needed" trendType="error" />
        </FadeInItem>
      </StaggerList>

      <motion.div
        className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-8 dark:border dark:border-neutral-800/50"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-bold font-headline mb-6">Stock by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filtered} layout="vertical" barCategoryGap={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ecefec" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fontSize: 12, fill: "#2d3432", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #ecefec", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="totalItems" fill="#4d6172" radius={[0, 6, 6, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        className="bg-white dark:bg-[#1C1C1C] rounded-xl p-8 border border-surface-container-low dark:border-neutral-800/50"
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-bold font-headline mb-6">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <tr className="border-b border-surface-container dark:border-neutral-800">
                  <TableHead className="px-6">Category</TableHead>
                  <TableHead className="px-6 text-right">Total Items</TableHead>
                  <TableHead className="px-6 text-right">Value</TableHead>
                  <TableHead className="px-6 text-right">Turnover Rate</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => (
                  <motion.tr
                    key={row.category}
                    className="group hover:bg-background dark:hover:bg-neutral-800/20 transition-colors border-b border-surface-container-low/50 dark:border-neutral-800/30"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <TableCell className="px-6 font-semibold">{row.category}</TableCell>
                    <TableCell className="px-6 text-right">{row.totalItems.toLocaleString()}</TableCell>
                    <TableCell className="px-6 text-right font-semibold">{formatCurrency(parseAmt(row.value))}</TableCell>
                    <TableCell className="px-6 text-right">
                      <span className="px-2 py-0.5 bg-secondary-container/30 text-secondary text-xs font-bold rounded">
                        {row.turnover}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </PageTransition>
  );
}
     