using System.Globalization;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.CustomerPortal;

public class CustomerInvoiceService : ICustomerInvoiceService
{
    private readonly ICustomerRepository _customers;
    private readonly IInvoiceRepository _invoices;

    public CustomerInvoiceService(ICustomerRepository customers, IInvoiceRepository invoices)
    {
        _customers = customers;
        _invoices = invoices;
    }

    public async Task<IReadOnlyList<CustomerInvoiceDto>> ListPosInvoicesAsync(Guid customerUserId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByIdWithDetailsAsync(customerUserId, cancellationToken);
        if (user == null)
            return Array.Empty<CustomerInvoiceDto>();

        var list = await _invoices.ListByCustomerIdWithItemsAsync(customerUserId, 250, cancellationToken);
        return list
            .Where(i => i.InvoiceNumber.StartsWith("POS-", StringComparison.OrdinalIgnoreCase))
            .Select(Map)
            .ToList();
    }

    public async Task PayInvoiceAsync(Guid customerUserId, Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByIdWithDetailsAsync(customerUserId, cancellationToken);
        if (user?.CustomerProfile == null)
            throw new KeyNotFoundException("Customer not found.");

        var invoice = await _invoices.GetByIdAndCustomerIdForUpdateAsync(invoiceId, customerUserId, cancellationToken);
        if (invoice == null)
            throw new KeyNotFoundException("Invoice not found.");

        if (invoice.Status == InvoiceStatus.Paid)
            throw new InvalidOperationException("This invoice is already paid.");

        if (invoice.BalanceDue <= 0)
            throw new InvalidOperationException("There is no balance due on this invoice.");

        var amount = invoice.BalanceDue;
        invoice.Status = InvoiceStatus.Paid;
        invoice.BalanceDue = 0m;

        var profile = user.CustomerProfile;
        profile.OutstandingCredit = Math.Max(0m, profile.OutstandingCredit - amount);
        profile.TotalSpent += amount;

        _invoices.AddPayment(new Payment
        {
            InvoiceId = invoice.Id,
            CustomerId = customerUserId,
            PaymentMethod = "customer_portal",
            Amount = amount,
            PaidAtUtc = DateTime.UtcNow,
            TransactionReference = $"PORTAL-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Status = "success"
        });

        await _customers.UpdateProfileAsync(profile, cancellationToken);
        await _invoices.SaveChangesAsync(cancellationToken);
    }

    private static CustomerInvoiceDto Map(Invoice i) =>
        new(
            i.Id,
            i.InvoiceNumber,
            i.TotalAmount,
            i.BalanceDue,
            i.IssueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            i.DueDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                ?? i.IssueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            i.Status.ToString(),
            i.Items.Select(x => new InvoiceItemDto(x.Description, x.ItemType, x.Quantity, x.UnitPrice, x.LineTotal)).ToList());
}
