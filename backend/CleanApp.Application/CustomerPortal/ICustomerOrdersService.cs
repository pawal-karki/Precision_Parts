namespace CleanApp.Application.CustomerPortal;

public interface ICustomerOrdersService
{
    Task<IReadOnlyList<CustomerOrderRow>> ListCustomerOrdersAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<LoyaltyStatusDto?> GetLoyaltyStatusAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<string> PlaceOrderAsync(Guid customerId, CreateCustomerOrderDto dto, CancellationToken cancellationToken = default);
}
