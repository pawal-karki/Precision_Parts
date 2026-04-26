using System.Globalization;
using CleanApp.Application.Demo;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Admin;

public class AdminFinancialService : IAdminFinancialService
{
    private readonly IInvoiceRepository _invoices;
    private readonly IPartRepository _parts;
    private readonly IDemoContentProvider _demo;

    public AdminFinancialService(
        IInvoiceRepository invoices, 
        IPartRepository parts,
        IDemoContentProvider demo)
    {
        _invoices = invoices;
        _parts = parts;
        _demo = demo;
    }

    public async Task<FinancialSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var paid = await _invoices.ListPaidWithItemsAsync(cancellationToken);
        var allParts = await _parts.ListWithCategoryAndVendorOrderedBySkuAsync(cancellationToken);
        var partCosts = allParts.ToDictionary(p => p.Id, p => p.CostPrice ?? (p.UnitPrice * 0.6m));

        decimal revenue = 0;
        decimal expenses = 0;

        foreach (var inv in paid)
        {
            revenue += inv.TotalAmount;
            foreach (var item in inv.Items)
            {
                if (item.ItemType == "part" && item.RefId.HasValue && partCosts.TryGetValue(item.RefId.Value, out var cost))
                {
                    expenses += cost * item.Quantity;
                }
                else
                {
                    // For services or parts with missing costs, estimate 45% margin
                    expenses += item.LineTotal * 0.55m;
                }
            }
        }

        var profit = revenue - expenses;
        var margin = revenue == 0 ? 0 : Math.Round(100m * profit / revenue, 1);

        return new FinancialSummaryDto(
            revenue,
            expenses,
            profit,
            margin.ToString("0.0", CultureInfo.InvariantCulture) + "%");
    }

    public async Task<IReadOnlyList<ProfitLossMonthRow>> GetProfitLossAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow;
        var start = today.AddMonths(-11);
        var from = new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var paid = await _invoices.ListPaidWithItemsAsync(cancellationToken);
        var invs = paid.Where(i => i.IssueDate >= from).ToList();
        
        var allParts = await _parts.ListWithCategoryAndVendorOrderedBySkuAsync(cancellationToken);
        var partCosts = allParts.ToDictionary(p => p.Id, p => p.CostPrice ?? (p.UnitPrice * 0.6m));

        var rows = new List<ProfitLossMonthRow>(12);
        for (var i = 0; i < 12; i++)
        {
            var d = start.AddMonths(i);
            var monthInvs = invs.Where(x => x.IssueDate.Year == d.Year && x.IssueDate.Month == d.Month).ToList();
            
            decimal rev = monthInvs.Sum(x => x.TotalAmount);
            decimal exp = 0;

            foreach (var inv in monthInvs)
            {
                foreach (var item in inv.Items)
                {
                    if (item.ItemType == "part" && item.RefId.HasValue && partCosts.TryGetValue(item.RefId.Value, out var cost))
                        exp += cost * item.Quantity;
                    else
                        exp += item.LineTotal * 0.55m;
                }
            }

            rows.Add(new ProfitLossMonthRow(
                d.ToString("MMM", CultureInfo.InvariantCulture),
                (double)rev,
                (double)exp));
        }

        return rows;
    }

    public async Task<IReadOnlyList<FinancialReportRowDto>> GetFinancialReportsAsync(CancellationToken cancellationToken = default)
    {
        var paid = await _invoices.ListPaidWithItemsAsync(cancellationToken);
        var allParts = await _parts.ListWithCategoryAndVendorOrderedBySkuAsync(cancellationToken);
        var partCosts = allParts.ToDictionary(p => p.Id, p => p.CostPrice ?? (p.UnitPrice * 0.6m));

        // Group by Quarter
        var groups = paid
            .GroupBy(i => new { i.IssueDate.Year, Quarter = (i.IssueDate.Month - 1) / 3 + 1 })
            .OrderByDescending(g => g.Key.Year)
            .ThenByDescending(g => g.Key.Quarter)
            .Take(4)
            .ToList();

        var result = new List<FinancialReportRowDto>();
        var id = 1;

        foreach (var g in groups)
        {
            decimal rev = g.Sum(i => i.TotalAmount);
            decimal exp = 0;

            foreach (var inv in g)
            {
                foreach (var item in inv.Items)
                {
                    if (item.ItemType == "part" && item.RefId.HasValue && partCosts.TryGetValue(item.RefId.Value, out var cost))
                        exp += cost * item.Quantity;
                    else
                        exp += item.LineTotal * 0.55m;
                }
            }

            var profit = rev - exp;
            var margin = rev == 0 ? 0 : Math.Round(100m * profit / rev, 1);

            result.Add(new FinancialReportRowDto(
                id++,
                $"Q{g.Key.Quarter} {g.Key.Year}",
                rev,
                exp,
                profit,
                margin.ToString("0.0", CultureInfo.InvariantCulture) + "%"
            ));
        }

        return result;
    }
}
     