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
    /// <summary>Sum of all invoice totals and largest single invoice for the customer (loyalty / dashboard).</summary>
    Task<(decimal SumTotalAmount, decimal MaxSingleAmount)> GetCustomerSpendAggregatesAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<int> CountForCustomerExcludingPaidAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<Invoice?> GetByIdAndCustomerIdForUpdateAsync(Guid invoiceId, Guid customerId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListPosForStaffAsync(int take, CancellationToken cancellationToken = default);
    Task<Invoice?> GetPosInvoiceByIdForUpdateAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    Task<Invoice?> GetPosInvoiceByIdForDetailAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    void Add(Invoice invoice);
    void AddPayment(Payment payment);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
    