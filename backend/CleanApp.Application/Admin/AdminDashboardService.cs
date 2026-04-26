using System.Globalization;
using CleanApp.Application.Demo;
using CleanApp.Domain.Repositories;
using CleanApp.Domain.Services;

namespace CleanApp.Application.Admin;

public class AdminDashboardService : IAdminDashboardService
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPartRepository _parts;
    private readonly ICustomerRepository _customers;
    private readonly IDemoContentProvider _demo;

    public AdminDashboardService(
        IInvoiceRepository invoices,
        IPartRepository parts,
        ICustomerRepository customers,
        IDemoContentProvider demo)
    {
        _invoices = invoices;
        _parts = parts;
        _customers = customers;
        _demo = demo;
    }

    public async Task<AdminKpisDto> GetKpisAsync(CancellationToken cancellationToken = default)
    {
        var paid = await _invoices.ListPaidAsync(cancellationToken);
        var revenue = paid.Sum(i => i.TotalAmount);
        var low = await _parts.CountBelowStockThresholdAsync(10, cancellationToken);
        var active = await _customers.CountActiveCustomersAsync(cancellationToken);
        var sales = paid.Count;

        return new AdminKpisDto(
            TotalRevenue: new KpiMetricDto(DisplayMoney.Format(revenue), "+12.4%", "up"),
            TotalSales: new KpiMetricDto(sales.ToString("N0", CultureInfo.InvariantCulture), "+4.2%", "up"),
            ActiveCustomers: new KpiMetricDto(active.ToString(CultureInfo.InvariantCulture), "Steady", "neutral"),
            LowStockItems: new KpiMetricDto(low.ToString(CultureInfo.InvariantCulture), "Action Needed", "error"));
    }

    public async Task<IReadOnlyList<RevenueChartPoint>> GetRevenueSeriesAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow;
        var start = today.AddMonths(-11);
        var from = new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var invs = await _invoices.ListByIssueDateFromAsync(from, cancellationToken);

        var months = new List<RevenueChartPoint>(12);
        for (var i = 0; i < 12; i++)
        {
            var d = start.AddMonths(i);
            var actual = invs.Where(x => x.IssueDate.Year == d.Year && x.IssueDate.Month == d.Month).Sum(x => x.TotalAmount);
            var projected = Math.Round(actual * 0.95m, 0);
            months.Add(new RevenueChartPoint(
                d.ToString("MMM", CultureInfo.InvariantCulture),
                (double)actual,
                (double)projected));
        }

        return months;
    }

    public async Task<IReadOnlyList<CategoryDistributionSlice>> GetCategoryDistributionAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _parts.GetCategoryStockDistributionTopAsync(6, cancellationToken);
        var total = rows.Sum(x => x.StockQty);
        if (total == 0)
            return Array.Empty<CategoryDistributionSlice>();

        return rows.Select(r => new CategoryDistributionSlice(
            r.Name,
            (int)Math.Round(100.0 * r.StockQty / total))).ToList();
    }

    public async Task<IReadOnlyList<TopSellingPartRow>> GetTopPartsAsync(CancellationToken cancellationToken = default)
    {
        var list = await _parts.TopByStockQtyTakeAsync(5, cancellationToken);
        var max = list.Count == 0 ? 0 : list.Max(p => p.StockQty);
        if (max == 0)
            return Array.Empty<TopSellingPartRow>();

        return list.Select(p => new TopSellingPartRow(
            p.Name,
            p.StockQty,
            (int)Math.Round(100.0 * p.StockQty / max))).ToList();
    }

    public async Task<IReadOnlyList<AdminAlertRow>> GetAlertsAsync(CancellationToken cancellationToken = default)
    {
        var alerts = new List<AdminAlertRow>();
        var id = 1;
        foreach (var p in await _parts.ListBelowReorderLevelTakeAsync(5, cancellationToken))
        {
            var level = PartInventoryRules.Classify(p);
            var isCritical = level == StockHealthLevel.Critical;
            alerts.Add(new AdminAlertRow(
                id++,
                isCritical ? "error" : "warning",
                isCritical ? "error" : "tertiary",
                isCritical ? "Low Stock Warning" : "Reorder Suggestion",
                $"{p.Name} (SKU: {p.Sku}) is below threshold ({p.StockQty} units).",
                "Reorder"));
        }

        foreach (var c in await _customers.ListProfilesWithOutstandingCreditTakeAsync(3, cancellationToken))
        {
            alerts.Add(new AdminAlertRow(
                id++,
                "error",
                "error",
                "Overdue Credit Limit",
                $"{c.User.FullName} outstanding balance ${c.OutstandingCredit:N2}.",
                "Review"));
        }

        alerts.Add(new AdminAlertRow(
            id++,
            "info",
            "neutral",
            "Shipment Delayed",
            "European Logistics report 2-day delay on Engine block units.",
            "Track"));

        return alerts;
    }

    public IReadOnlyList<object> GetActivity() => _demo.ActivityLedger;

    public IReadOnlyList<object> GetAuditLog() => _demo.AuditLog;
}
     