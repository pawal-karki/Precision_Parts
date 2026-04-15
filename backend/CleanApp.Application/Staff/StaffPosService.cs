using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Staff;

public class StaffPosService : IStaffPosService
{
    private readonly IPartRepository _parts;

    public StaffPosService(IPartRepository parts) => _parts = parts;

    public async Task<IReadOnlyList<StaffPosProductRow>> GetProductsAsync(CancellationToken cancellationToken = default)
    {
        var parts = await _parts.ListWithCategoryOrderByNameTakeAsync(12, cancellationToken);
        var i = 0;
        return parts.Select(p => new StaffPosProductRow(
            ++i,
            p.Name,
            p.Sku,
            (double)p.UnitPrice,
            p.StockQty,
            p.Category?.Name ?? "General")).ToList();
    }
}
   