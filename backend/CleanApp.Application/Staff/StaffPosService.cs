using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Staff;

public class StaffPosService : IStaffPosService
{
    private readonly IPartRepository _parts;
    private readonly IInvoiceRepository _invoices;
    private readonly ICustomerRepository _customers;

    public StaffPosService(
        IPartRepository parts, 
        IInvoiceRepository invoices, 
        ICustomerRepository customers)
    {
        _parts = parts;
        _invoices = invoices;
        _customers = customers;
    }

    public async Task<IReadOnlyList<StaffPosProductRow>> GetProductsAsync(CancellationToken cancellationToken = default)
    {
        var parts = await _parts.ListWithCategoryOrderByNameTakeAsync(24, cancellationToken);
        var i = 0;
        return parts.Select(p => new StaffPosProductRow(
            ++i,
            p.Name,
            p.Sku,
            (double)p.UnitPrice,
            p.StockQty,
            p.Category?.Name ?? "General",
            p.ImageUrl)).ToList();
    }

    public async Task<string> CheckoutAsync(CreatePosSaleDto request, CancellationToken cancellationToken = default)
    {
        // 1. Fetch Customer if provided
        CustomerProfile? customer = null;
        if (request.CustomerId.HasValue)
        {
            customer = await _customers.GetProfileByIdAsync(request.CustomerId.Value, cancellationToken);
        }

        // 2. Create Invoice
        var invoiceNumber = $"POS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6]}".ToUpper();
        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = request.CustomerId,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow,
            Status = InvoiceStatus.Paid,
            Subtotal = request.Subtotal,
            TaxAmount = request.Tax,
            DiscountAmount = request.Discount,
            TotalAmount = request.Total,
            BalanceDue = 0,
            Items = new List<InvoiceItem>()
        };

        // 3. Process Items and Deduct Stock
        foreach (var itemDto in request.Items)
        {
            var part = await _parts.GetBySkuAsync(itemDto.Sku, cancellationToken);
            if (part == null) continue;

            // Deduct Stock
            part.StockQty = Math.Max(0, part.StockQty - itemDto.Quantity);
            _parts.Update(part);

            invoice.Items.Add(new InvoiceItem
            {
                ItemType = "part",
                RefId = part.Id,
                Description = part.Name,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                LineTotal = itemDto.Quantity * itemDto.UnitPrice
            });
        }

        // 4. Update Customer Ledger
        if (customer != null)
        {
            customer.TotalSpent += request.Total;
            customer.LastOrderDate = DateOnly.FromDateTime(DateTime.UtcNow);
            await _customers.UpdateProfileAsync(customer, cancellationToken);
        }

        // 5. Persist Invoice
        _invoices.Add(invoice);
        await _invoices.SaveChangesAsync(cancellationToken);

        return invoice.InvoiceNumber;
    }
}