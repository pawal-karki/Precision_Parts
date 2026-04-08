using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IInvoiceRepository
{
    Task<IReadOnlyList<Invoice>> ListPaidAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListByIssueDateFromAsync(DateOnly fromInclusive, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListPaidByIssueDateFromAsync(DateOnly fromInclusive, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListByCustomerIdWithItemsAsync(Guid customerId, int take, CancellationToken cancellationToken = default);
    Task<int> CountForCustomerExcludingPaidAsync(Guid customerId, CancellationToken cancellationToken = default);
}
    