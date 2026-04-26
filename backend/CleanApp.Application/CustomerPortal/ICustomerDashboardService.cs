namespace CleanApp.Application.CustomerPortal;

public interface ICustomerDashboardService
{
    Task<CustomerDashboardDto?> GetCustomerDashboardAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<CustomerLedgerDto?> GetCustomerLedgerAsync(Guid customerId, CancellationToken cancellationToken = default);
}
          