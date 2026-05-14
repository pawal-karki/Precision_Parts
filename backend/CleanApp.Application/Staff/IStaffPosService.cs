namespace CleanApp.Application.Staff;

public record StaffPosProductRow(int Id, string Name, string Sku, double Price, int Stock, string Category, string? ImageUrl = null);

/// <summary>POS checkout body. Use <see cref="OnAccount"/> or <see cref="PayInFull"/> — both are bound reliably as properties (not a positional record).</summary>
public sealed class CreatePosSaleDto
{
    public Guid? CustomerId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public decimal Total { get; set; }
    public List<PosSaleItemDto> Items { get; set; } = new();

    /// <summary>When true, sale is recorded on account (unpaid at counter).</summary>
    public bool? OnAccount { get; set; }

    /// <summary>When false, sale is on account. When true or omitted, settled at counter unless <see cref="OnAccount"/> is true.</summary>
    public bool? PayInFull { get; set; }
}

public record PosSaleItemDto(string Sku, int Quantity, decimal UnitPrice);

public record PosCheckoutResult(Guid InvoiceId, string InvoiceNumber);

public interface IStaffPosService
{
    Task<IReadOnlyList<StaffPosProductRow>> GetProductsAsync(CancellationToken cancellationToken = default);
    Task<PosCheckoutResult> CheckoutAsync(CreatePosSaleDto request, Guid? createdByUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StaffPosSaleListItemDto>> ListPosHistoryAsync(int take, CancellationToken cancellationToken = default);
    Task<StaffPosSaleDetailDto?> GetPosSaleDetailAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    Task UpdatePosSaleAsync(Guid invoiceId, UpdateStaffPosSaleDto dto, Guid? staffActorId, CancellationToken cancellationToken = default);
}
