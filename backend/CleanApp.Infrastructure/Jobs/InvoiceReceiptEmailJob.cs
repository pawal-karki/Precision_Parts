using CleanApp.Application.Email;
using CleanApp.Application.Pdf;
using CleanApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CleanApp.Infrastructure.Jobs;

/// <summary>
/// Sends the customer invoice PDF receipt by email after POS checkout.
/// Enqueued via Hangfire so the HTTP request returns immediately.
/// </summary>
public class InvoiceReceiptEmailJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<InvoiceReceiptEmailJob> _logger;

    public InvoiceReceiptEmailJob(IServiceScopeFactory scopeFactory, ILogger<InvoiceReceiptEmailJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task SendReceiptAsync(Guid invoiceId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pdf = scope.ServiceProvider.GetRequiredService<IPdfService>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var invoice = await db.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice is null)
        {
            _logger.LogWarning("InvoiceReceiptEmailJob: Invoice {InvoiceId} not found.", invoiceId);
            return;
        }

        if (invoice.CustomerId is null || invoice.CustomerId == Guid.Empty)
            return;

        var user = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == invoice.CustomerId.Value);

        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            _logger.LogWarning(
                "InvoiceReceiptEmailJob: Skipping email for invoice {InvoiceId} — user missing or no email.",
                invoiceId);
            return;
        }

        try
        {
            var pdfBytes = pdf.GenerateInvoicePdf(invoice, user.FullName);
            await email.SendInvoiceReceiptAsync(
                user.Email,
                user.FullName,
                invoice.InvoiceNumber,
                invoice.TotalAmount,
                pdfBytes,
                CancellationToken.None);

            _logger.LogInformation(
                "InvoiceReceiptEmailJob: Sent receipt for {InvoiceNumber} to {Email}.",
                invoice.InvoiceNumber,
                user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "InvoiceReceiptEmailJob: Failed to send receipt for invoice {InvoiceId}.", invoiceId);
        }
    }
}
