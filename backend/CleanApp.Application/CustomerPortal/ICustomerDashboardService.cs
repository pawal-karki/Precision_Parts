namespace CleanApp.Application.CustomerPortal;

public interface ICustomerDashboardService
{
    Task<CustomerDashboardDto?> GetDemoCustomerDashboardAsync(CancellationToken cancellationToken = default);
}
          