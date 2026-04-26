using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IInvoiceRepository
{
    Task<IReadOnlyList<Invoice>> ListPaidAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListPaidWithItemsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListByIssueDateFromAsync(DateTime fromInclusive, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListPaidByIssueDateFromAsync(DateTime fromInclusive, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListByCustomerIdWithItemsAsync(Guid customerId, int take, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<int> CountForCustomerExcludingPaidAsync(Guid customerId, CancellationToken cancellationToken = default);
    void Add(Invoice invoice);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
    