namespace CleanApp.Application.Admin;

public record FinancialSummaryDto(string Revenue, string Expenses, string Profit, string Margin);

public record ProfitLossMonthRow(string Month, double Revenue, double Expenses);

public interface IAdminFinancialService
{
    Task<FinancialSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProfitLossMonthRow>> GetProfitLossAsync(CancellationToken cancellationToken = default);
    IReadOnlyList<object> GetReportRows();
}
       