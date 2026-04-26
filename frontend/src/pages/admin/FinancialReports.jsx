import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import {
  PageTransition,
  StaggerList,
  FadeInItem,
  motion,
  fadeInUp,
  staggerContainer,
} from "@/components/ui/motion";
import { generateReportPdf, downloadPdf } from "@/lib/pdf";
import { formatCurrency } from "@/lib/currency";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FinancialReports() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [plData, setPlData] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getFinancialSummary(),
      api.getProfitLoss(),
      api.getFinancialReports(),
    ]).then(([s, p, r]) => {
      setSummary(s);
      setPlData(p);
      setReports(r);
    });
  }, []);

  const handleExport = () => {
    if (!reports.length) {
      toast("No report data to export", "warning");
      return;
    }
    try {
      const columns = ["Period", "Revenue", "Expenses", "Profit", "Margin"];
      const rows = reports.map((r) => [
        r.period,
        formatCurrency(r.revenue),
        formatCurrency(r.expenses),
        formatCurrency(r.profit),
        r.margin,
      ]);
      const doc = generateReportPdf("Financial Report — Quarterly Summary", columns, rows);
      downloadPdf(doc, `Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast("PDF exported successfully", "success");
    } catch {
      toast("Failed to generate PDF", "error");
    }
  };

  if (!summary) {
    return (
      <div className="animate-pulse text-on-surface-variant flex items-center gap-2">
        <Icon name="hourglass_empty" className="text-lg animate-spin" />
        Loading financial data...
      </div>
    );
  }

  const parseAmt = (val) => typeof val === 'number' ? val : Number(String(val).replace(/[^0-9.-]+/g, ""));

  return (
    <PageTransition className="space-y-10">
      <section className="flex flex-col md:flex-row justify-between md:items-end items-start gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface dark:text-neutral-100 tracking-tight font-headline">
            Financial Reports
          </h1>
          <p className="text-on-surface-variant dark:text-neutral-500 mt-1">
            Profit/Loss trends, revenue analytics, and exportable data.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="surface">
            <Icon name="calendar_today" className="text-sm" />
            FY {new Date().getFullYear()}
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Icon name="download" className="text-sm" />
            Export
          </Button>
        </div>
      </section>

      {/* Summary KPIs */}
      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <FadeInItem>
          <KpiCard icon="payments" label="Total Revenue" value={formatCurrency(summary.revenue)} trend="Current" trendType="neutral" />
        </FadeInItem>
        <FadeInItem>
          <KpiCard icon="account_balance" label="Total Expenses" value={formatCurrency(summary.expenses)} trend="Calculated" trendType="neutral" />
        </FadeInItem>
        <FadeInItem>
          <KpiCard icon="trending_up" label="Net Profit" value={formatCurrency(summary.profit)} trend="Actual" trendType="neutral" />
        </FadeInItem>
        <FadeInItem>
          <KpiCard icon="percent" label="Profit Margin" value={summary.margin} trend="Overall" trendType="neutral" />
        </FadeInItem>
      </StaggerList>

      {/* P&L Chart */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-surface-container-low dark:bg-[#1C1C1C] rounded-xl p-8 dark:border dark:border-neutral-800/50 mt-8"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold font-headline">Profit & Loss Trend</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs font-medium text-on-surface-variant">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error" />
              <span className="text-xs font-medium text-on-surface-variant">Expenses</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={plData}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4d6172" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4d6172" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9f403d" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9f403d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ecefec" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#5a605e" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #ecefec",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#4d6172" fill="url(#revenueGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="#9f403d" fill="url(#expenseGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Report Table */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-[#1C1C1C] rounded-xl p-8 border border-surface-container-low dark:border-neutral-800/50 mt-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-headline">Quarterly Summary</h3>
          <Button variant="ghost" onClick={handleExport}>
            <Icon name="picture_as_pdf" className="text-sm" />
            Download PDF
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <tr className="border-b border-surface-container dark:border-neutral-800">
                  <TableHead className="px-6">Period</TableHead>
                  <TableHead className="px-6 text-right">Revenue</TableHead>
                  <TableHead className="px-6 text-right">Expenses</TableHead>
                  <TableHead className="px-6 text-right">Profit</TableHead>
                  <TableHead className="px-6 text-right">Margin</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {reports.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.06 } }}
                    className="border-b border-surface-container-low/50 dark:border-neutral-800/30 group hover:bg-background dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <TableCell className="px-6 font-semibold">{row.period}</TableCell>
                    <TableCell className="px-6 text-right font-semibold">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className="px-6 text-right text-on-surface-variant dark:text-neutral-400">{formatCurrency(row.expenses)}</TableCell>
                    <TableCell className="px-6 text-right font-bold text-emerald-600">{formatCurrency(row.profit)}</TableCell>
                    <TableCell className="px-6 text-right font-semibold">{row.margin}</TableCell>
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
     