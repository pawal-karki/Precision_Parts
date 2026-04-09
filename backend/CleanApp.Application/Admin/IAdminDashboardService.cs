namespace CleanApp.Application.Admin;

public interface IAdminDashboardService
{
    Task<AdminKpisDto> GetKpisAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RevenueChartPoint>> GetRevenueSeriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CategoryDistributionSlice>> GetCategoryDistributionAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TopSellingPartRow>> GetTopPartsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminAlertRow>> GetAlertsAsync(CancellationToken cancellationToken = default);
    IReadOnlyList<object> GetActivity();

    IReadOnlyList<object> GetAuditLog();
}
     