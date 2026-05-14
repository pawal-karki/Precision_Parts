using CleanApp.Application.Staff;
using Hangfire;

namespace CleanApp.Infrastructure.Jobs;

public class HangfireInvoiceReceiptEmailQueue : IInvoiceReceiptEmailQueue
{
    private readonly IBackgroundJobClient _jobs;

    public HangfireInvoiceReceiptEmailQueue(IBackgroundJobClient jobs) => _jobs = jobs;

    public void Enqueue(Guid invoiceId) =>
        _jobs.Enqueue<InvoiceReceiptEmailJob>(job => job.SendReceiptAsync(invoiceId));
}
