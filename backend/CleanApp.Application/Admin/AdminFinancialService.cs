using System.Globalization;
using CleanApp.Application.Demo;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Admin;

public class AdminFinancialService : IAdminFinancialService
{
    private readonly IInvoiceRepository _invoices;
    private readonly IDemoContentProvider _demo;

    public AdminFinancialService(IInvoiceRepository invoices, IDemoContentProvider demo)
    {
        _invoices = invoices;
        _demo = demo;
    }

    public async Task<FinancialSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var paid = await _invoices.ListPaidAsync(cancellationToken);
        var revenue = paid.Sum(i => i.TotalAmount);
        var expenses = Math.Round(revenue * 0.65m, 2);
        var profit = revenue - expenses;
        var margin = revenue == 0 ? 0 : Math.Round(100m * profit / revenue, 1);

        return new FinancialSummaryDto(
            DisplayMoney.Format(revenue, 0),
            DisplayMoney.Format(expenses, 0),
            DisplayMoney.Format(profit, 0),
            margin.ToString("0.0", CultureInfo.InvariantCulture) + "%");
    }

    public async Task<IReadOnlyList<ProfitLossMonthRow>> GetProfitLossAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow;
        var start = today.AddMonths(-11);
        var from = new DateTime(start.Year, start.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var invs = await _invoices.ListPaidByIssueDateFromAsync(from, cancellationToken);

        var rows = new List<ProfitLossMonthRow>(12);
        for (var i = 0; i < 12; i++)
        {
            var d = start.AddMonths(i);
            var rev = invs.Where(x => x.IssueDate.Year == d.Year && x.IssueDate.Month == d.Month).Sum(x => x.TotalAmount);
            var exp = Math.Round(rev * 0.64m, 0);
            rows.Add(new ProfitLossMonthRow(
                d.ToString("MMM", CultureInfo.InvariantCulture),
                (double)rev,
                (double)exp));
        }

        return rows;
    }

    public IReadOnlyList<object> GetReportRows() => _demo.FinancialReportRows;
}
     