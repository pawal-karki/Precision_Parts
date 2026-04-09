namespace CleanApp.Application.Admin;

public record InventoryReportRowDto(string Category, int TotalItems, string Value, string Turnover);

public interface IAdminInventoryReportsService
{
    Task<IReadOnlyList<InventoryReportRowDto>> GetReportsAsync(CancellationToken cancellationToken = default);
}
            