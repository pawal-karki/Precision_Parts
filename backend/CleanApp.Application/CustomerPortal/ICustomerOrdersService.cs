namespace CleanApp.Application.CustomerPortal;

public interface ICustomerOrdersService
{
    Task<IReadOnlyList<CustomerOrderRow>> ListCustomerOrdersAsync(Guid customerId, CancellationToken cancellationToken = default);
}
