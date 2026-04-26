namespace CleanApp.Application.Staff;

public record StaffPosProductRow(int Id, string Name, string Sku, double Price, int Stock, string Category);

public record CreatePosSaleDto(
    Guid? CustomerId, 
    decimal Subtotal, 
    decimal Tax, 
    decimal Discount, 
    decimal Total, 
    List<PosSaleItemDto> Items);

public record PosSaleItemDto(string Sku, int Quantity, decimal UnitPrice);

public interface IStaffPosService
{
    Task<IReadOnlyList<StaffPosProductRow>> GetProductsAsync(CancellationToken cancellationToken = default);
    Task<string> CheckoutAsync(CreatePosSaleDto request, CancellationToken cancellationToken = default);
}
