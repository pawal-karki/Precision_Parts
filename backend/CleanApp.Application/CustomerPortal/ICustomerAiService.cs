namespace CleanApp.Application.CustomerPortal;

public interface ICustomerAiService
{
    Task<IReadOnlyList<CustomerPredictionRow>> GetPredictionsAsync(CancellationToken cancellationToken = default);
    IReadOnlyList<object> GetMaintenanceTrend();
}
