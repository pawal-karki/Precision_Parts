namespace CleanApp.Application.CustomerPortal;

public interface ICustomerOrdersService
{
    Task<IReadOnlyList<CustomerOrderRow>> ListDemoCustomerOrdersAsync(CancellationToken cancellationToken = default);
}
