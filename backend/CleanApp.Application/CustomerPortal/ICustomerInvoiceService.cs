namespace CleanApp.Application.CustomerPortal;

public interface ICustomerInvoiceService
{
    Task<IReadOnlyList<CustomerInvoiceDto>> ListPosInvoicesAsync(Guid customerUserId, CancellationToken cancellationToken = default);
    Task PayInvoiceAsync(Guid customerUserId, Guid invoiceId, CancellationToken cancellationToken = default);
}
