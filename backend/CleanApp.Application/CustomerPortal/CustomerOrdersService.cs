using System.Globalization;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.CustomerPortal;

public class CustomerOrdersService : ICustomerOrdersService
{
    private readonly ICustomerRepository _customers;
    private readonly IInvoiceRepository _invoices;
    private readonly IPartRepository _parts;

    public CustomerOrdersService(ICustomerRepository customers, IInvoiceRepository invoices, IPartRepository parts)
    {
        _customers = customers;
        _invoices  = invoices;
        _parts     = parts;
    }

    public async Task<IReadOnlyList<CustomerOrderRow>> ListCustomerOrdersAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        // Get all activity data for the customer
        var (appointments, invoices, partRequests) = await _customers.GetActivityDataAsync(customerId, cancellationToken);

        var orders = new List<CustomerOrderRow>();

        // 1. Add Invoices as completed/billed orders
        foreach (var inv in invoices)
        {
            var itemsDesc = inv.Items.Any() 
                ? string.Join(", ", inv.Items.Select(x => x.Description))
                : "General Service / Parts";

            orders.Add(new CustomerOrderRow(
                inv.InvoiceNumber,
                inv.IssueDate.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                inv.IssueDate.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                itemsDesc,
                DisplayMoney.Format(inv.TotalAmount),
                inv.TotalAmount,
                inv.Status == InvoiceStatus.Paid ? "Delivered" : "Processing",
                inv.Items.Select(x => new InvoiceItemDto(x.Description, x.ItemType, x.Quantity, x.UnitPrice, x.LineTotal)).ToList()
            ));
        }

        // 2. Add PartRequests as active sourcing orders
        foreach (var pr in partRequests)
        {
            // Map PartRequest statuses to UI badge statuses
            var status = pr.Status switch
            {
                "Available" => "Delivered",
                "Cancelled" => "Returned",
                _ => "Processing" // Pending, Sourcing -> Processing
            };

            orders.Add(new CustomerOrderRow(
                $"PR-{pr.Id.ToString().Substring(0, 8).ToUpper()}",
                pr.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                pr.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                $"{pr.PartName} for {pr.VehicleModel}",
                "N/A",
                0m,
                status,
                new List<InvoiceItemDto> { new InvoiceItemDto(pr.PartName, "sourcing", 1, 0, 0) }
            ));
        }

        // Return ordered by date descending
        return orders
            .OrderByDescending(o => o.OrderDate)
            .ToList();
    }

    public async Task<LoyaltyStatusDto?> GetLoyaltyStatusAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByIdWithDetailsAsync(customerId, cancellationToken);
        if (user == null) return null;

        var totalSpent = user.CustomerProfile?.TotalSpent ?? 0m;
        var tier = user.CustomerProfile?.LoyaltyTier ?? "standard";
        var loyaltyPoints = (int)Math.Min(99999, totalSpent * 0.28m);

        // Compute max single order from actual invoice history
        var invoices = await _invoices.ListByCustomerIdWithItemsAsync(user.Id, 100, cancellationToken);
        var maxSingle = invoices.Any() ? invoices.Max(i => i.TotalAmount) : 0m;

        var discountEligible = maxSingle >= 5000m;
        var discountPercent  = discountEligible ? 10 : 0;

        return new LoyaltyStatusDto(
            totalSpent,
            tier,
            loyaltyPoints,
            discountEligible,
            maxSingle,
            discountPercent
        );
    }

    public async Task<string> PlaceOrderAsync(Guid customerId, CreateCustomerOrderDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByIdWithDetailsAsync(customerId, cancellationToken);
        if (user == null) throw new KeyNotFoundException("Customer not found");

        var profile = user.CustomerProfile;
        
        // 1. Calculate base totals
        decimal subtotal = 0;
        var invoiceItems = new List<InvoiceItem>();

        foreach (var item in dto.Items)
        {
            var part = await _parts.GetBySkuAsync(item.Sku, cancellationToken);
            if (part == null) continue;

            var lineTotal = part.UnitPrice * item.Quantity;
            subtotal += lineTotal;

            invoiceItems.Add(new InvoiceItem
            {
                ItemType = "part",
                RefId = part.Id,
                Description = part.Name,
                Quantity = item.Quantity,
                UnitPrice = part.UnitPrice,
                LineTotal = lineTotal
            });

            // Deduct Stock
            part.StockQty = Math.Max(0, part.StockQty - (int)item.Quantity);
            _parts.Update(part);
        }

        // 2. Discount Logic: 10% discount if current order >= 5000
        bool isDiscountEligible = subtotal >= 5000m;
        decimal discount = isDiscountEligible ? subtotal * 0.10m : 0m;
        decimal total = subtotal - discount;

        // 3. Create Invoice
        var invoice = new Invoice
        {
            InvoiceNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6]}".ToUpper(),
            CustomerId = customerId,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow, // Instant payment for online orders usually
            Status = InvoiceStatus.Paid,
            Subtotal = subtotal,
            TaxAmount = total * 0.13m, // Assuming 13% VAT
            DiscountAmount = discount,
            TotalAmount = total + (total * 0.13m),
            BalanceDue = 0,
            Items = invoiceItems
        };

        // 4. Update Profile
        if (profile != null)
        {
            profile.TotalSpent += invoice.TotalAmount;
            profile.LastOrderDate = DateOnly.FromDateTime(DateTime.UtcNow);
            await _customers.UpdateProfileAsync(profile, cancellationToken);
        }

        _invoices.Add(invoice);
        await _invoices.SaveChangesAsync(cancellationToken);

        return invoice.InvoiceNumber;
    }
}
