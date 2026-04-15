namespace CleanApp.Application.Staff;

public record StaffPosProductRow(int Id, string Name, string Sku, double Price, int Stock, string Category);

public interface IStaffPosService
{
    Task<IReadOnlyList<StaffPosProductRow>> GetProductsAsync(CancellationToken cancellationToken = default);
}
