namespace CleanApp.Application.Staff;

/// <summary>Queues POS invoice receipt email delivery (Hangfire-backed in the host).</summary>
public interface IInvoiceReceiptEmailQueue
{
    void Enqueue(Guid invoiceId);
}
