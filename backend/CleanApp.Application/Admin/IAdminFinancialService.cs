namespace CleanApp.Application.Admin;

public record FinancialSummaryDto(decimal Revenue, decimal Expenses, decimal Profit, string Margin);

public record ProfitLossMonthRow(string Month, double Revenue, double Expenses);

public record FinancialReportRowDto(int Id, string Period, decimal Revenue, decimal Expenses, decimal Profit, string Margin);

public interface IAdminFinancialService
{
    Task<FinancialSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProfitLossMonthRow>> GetProfitLossAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<FinancialReportRowDto>> GetFinancialReportsAsync(CancellationToken cancellationToken = default);
}