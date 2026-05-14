using System.Globalization;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Staff;

public class StaffPosService : IStaffPosService
{
    private readonly IPartRepository _parts;
    private readonly IInvoiceRepository _invoices;
    private readonly ICustomerRepository _customers;
    private readonly IInvoiceReceiptEmailQueue _receiptEmailQueue;

    public StaffPosService(
        IPartRepository parts,
        IInvoiceRepository invoices,
        ICustomerRepository customers,
        IInvoiceReceiptEmailQueue receiptEmailQueue)
    {
        _parts = parts;
        _invoices = invoices;
        _customers = customers;
        _receiptEmailQueue = receiptEmailQueue;
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

    public async Task<PosCheckoutResult> CheckoutAsync(
        CreatePosSaleDto request,
        Guid? createdByUserId,
        CancellationToken cancellationToken = default)
    {
        CustomerProfile? customer = null;
        if (request.CustomerId.HasValue)
            customer = await _customers.GetProfileByIdAsync(request.CustomerId.Value, cancellationToken);

        var invoiceNumber = $"POS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6]}".ToUpper();
        var onAccount = request.OnAccount == true || request.PayInFull == false;
        if (onAccount)
        {
            if (!request.CustomerId.HasValue || request.CustomerId.Value == Guid.Empty)
                throw new ArgumentException("Select a customer to record a sale on account.");
            if (customer == null)
                throw new ArgumentException("Customer profile not found for this sale on account.");
        }

        var payNow = !onAccount;
        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = request.CustomerId,
            CreatedByUserId = createdByUserId,
            IssueDate = DateTime.UtcNow,
            DueDate = payNow ? DateTime.UtcNow : DateTime.UtcNow.AddDays(30),
            Status = payNow ? InvoiceStatus.Paid : InvoiceStatus.Unpaid,
            Subtotal = request.Subtotal,
            TaxAmount = request.Tax,
            DiscountAmount = request.Discount,
            TotalAmount = request.Total,
            BalanceDue = payNow ? 0m : request.Total,
            Items = new List<InvoiceItem>()
        };

        foreach (var itemDto in request.Items ?? new List<PosSaleItemDto>())
        {
            var part = await _parts.GetBySkuAsync(itemDto.Sku, cancellationToken);
            if (part == null) continue;

            part.StockQty = Math.Max(0, part.StockQty - itemDto.Quantity);
            _parts.Update(part);

            invoice.Items.Add(new InvoiceItem
            {
                ItemType = "part",
                RefId = part.Id,
                Description = $"{part.Name} ({part.Sku})",
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                LineTotal = itemDto.Quantity * itemDto.UnitPrice
            });
        }

        if (customer != null)
        {
            customer.LastOrderDate = DateOnly.FromDateTime(DateTime.UtcNow);
            if (payNow)
                customer.TotalSpent += request.Total;
            if (onAccount)
                customer.OutstandingCredit += request.Total;
            await _customers.UpdateProfileAsync(customer, cancellationToken);
        }

        _invoices.Add(invoice);
        await _invoices.SaveChangesAsync(cancellationToken);

        if (invoice.CustomerId is Guid uid && uid != Guid.Empty)
            _receiptEmailQueue.Enqueue(invoice.Id);

        return new PosCheckoutResult(invoice.Id, invoice.InvoiceNumber);
    }

    public async Task<IReadOnlyList<StaffPosSaleListItemDto>> ListPosHistoryAsync(int take, CancellationToken cancellationToken = default)
    {
        var list = await _invoices.ListPosForStaffAsync(Math.Clamp(take, 1, 500), cancellationToken);
        return list.Select(MapListItem).ToList();
    }

    public async Task<StaffPosSaleDetailDto?> GetPosSaleDetailAsync(Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var inv = await _invoices.GetPosInvoiceByIdForDetailAsync(invoiceId, cancellationToken);
        return inv == null ? null : MapDetail(inv);
    }

    public async Task UpdatePosSaleAsync(
        Guid invoiceId,
        UpdateStaffPosSaleDto dto,
        Guid? staffActorId,
        CancellationToken cancellationToken = default)
    {
        var invoice = await _invoices.GetPosInvoiceByIdForUpdateAsync(invoiceId, cancellationToken);
        if (invoice == null)
            throw new KeyNotFoundException("POS invoice not found.");

        if (dto.StaffNotes is not null)
            invoice.StaffNotes = dto.StaffNotes;

        if (!string.IsNullOrWhiteSpace(dto.DueDateIso))
        {
            if (!DateTime.TryParse(dto.DueDateIso, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var due))
                throw new ArgumentException("Invalid due date format. Use yyyy-MM-dd or ISO 8601.");
            invoice.DueDate = due;
        }

        if (dto.MarkCollectedAtCounter)
        {
            if (invoice.Status == InvoiceStatus.Paid)
                throw new InvalidOperationException("Invoice is already paid.");
            if (invoice.BalanceDue <= 0)
                throw new InvalidOperationException("There is no outstanding balance to collect.");

            var amount = invoice.BalanceDue;
            invoice.Status = InvoiceStatus.Paid;
            invoice.BalanceDue = 0m;

            if (invoice.CustomerId.HasValue)
            {
                var user = await _customers.GetCustomerByIdWithDetailsAsync(invoice.CustomerId.Value, cancellationToken);
                if (user?.CustomerProfile != null)
                {
                    user.CustomerProfile.OutstandingCredit = Math.Max(0m, user.CustomerProfile.OutstandingCredit - amount);
                    user.CustomerProfile.TotalSpent += amount;
                    await _customers.UpdateProfileAsync(user.CustomerProfile, cancellationToken);
                }
            }

            _invoices.AddPayment(new Payment
            {
                InvoiceId = invoice.Id,
                CustomerId = invoice.CustomerId,
                PaymentMethod = "staff_counter",
                Amount = amount,
                PaidAtUtc = DateTime.UtcNow,
                TransactionReference = staffActorId is Guid sid ? $"STAFF-{sid:N}" : "STAFF-UNKNOWN",
                Status = "success"
            });
        }

        await _invoices.SaveChangesAsync(cancellationToken);
    }

    private static StaffPosSaleListItemDto MapListItem(Invoice i) =>
        new(
            i.Id,
            i.InvoiceNumber,
            i.IssueDate,
            i.Status.ToString(),
            i.TotalAmount,
            i.BalanceDue,
            i.Status != InvoiceStatus.Paid && i.BalanceDue > 0,
            i.CustomerId,
            i.Customer?.FullName,
            i.Customer?.Email,
            i.CreatedByUserId,
            i.CreatedBy?.FullName,
            i.StaffNotes);

    private static StaffPosSaleDetailDto MapDetail(Invoice i) =>
        new(
            i.Id,
            i.InvoiceNumber,
            i.IssueDate,
            i.DueDate,
            i.Status.ToString(),
            i.Subtotal,
            i.TaxAmount,
            i.DiscountAmount,
            i.TotalAmount,
            i.BalanceDue,
            i.CustomerId,
            i.Customer?.FullName,
            i.Customer?.Email,
            i.CreatedByUserId,
            i.CreatedBy?.FullName,
            i.StaffNotes,
            i.Items.Select(x => new StaffPosSaleLineDto(x.Description, x.ItemType, x.Quantity, x.UnitPrice, x.LineTotal)).ToList(),
            i.Payments.Select(p => new StaffPosPaymentRowDto(p.PaidAtUtc, p.Amount, p.PaymentMethod, p.TransactionReference)).ToList());
}
