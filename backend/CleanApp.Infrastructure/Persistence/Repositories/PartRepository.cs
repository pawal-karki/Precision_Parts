using CleanApp.Domain.Entities;
using CleanApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence.Repositories;

public class PartRepository : IPartRepository
{
    private readonly AppDbContext _db;

    public PartRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Part>> ListWithCategoryAndVendorOrderedBySkuAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.Parts
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Vendor)
            .OrderBy(p => p.Sku)
            .ToListAsync(cancellationToken);
        return list;
    }

    public Task<Part?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Parts.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<Part?> GetBySkuAsync(string sku, CancellationToken cancellationToken = default) =>
        _db.Parts.FirstOrDefaultAsync(p => p.Sku == sku, cancellationToken);

    public Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken = default) =>
        _db.Parts.AnyAsync(p => p.Sku == sku, cancellationToken);

    public void Add(Part part) => _db.Parts.Add(part);

    public void Update(Part part) => _db.Parts.Update(part);

    public void Remove(Part part) => _db.Parts.Remove(part);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);

    public Task<int> CountBelowStockThresholdAsync(int threshold, CancellationToken cancellationToken = default) =>
        _db.Parts.CountAsync(p => p.StockQty < threshold, cancellationToken);

    public async Task<IReadOnlyList<Part>> ListBelowReorderLevelTakeAsync(int take, CancellationToken cancellationToken = default)
    {
        var list = await _db.Parts
            .AsNoTracking()
            .Where(x => x.StockQty < x.ReorderLevel)
            .OrderBy(x => x.StockQty)
            .Take(take)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<Part>> TopByStockQtyTakeAsync(int take, CancellationToken cancellationToken = default)
    {
        var list = await _db.Parts
            .AsNoTracking()
            .OrderByDescending(p => p.StockQty)
            .Take(take)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<(string Name, int StockQty)>> GetCategoryStockDistributionTopAsync(int take, CancellationToken cancellationToken = default)
    {
        var rows = await _db.Parts
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.Category != null)
            .GroupBy(p => p.Category!.Name)
            .Select(g => new { Name = g.Key, Value = g.Sum(x => x.StockQty) })
            .OrderByDescending(x => x.Value)
            .Take(take)
            .ToListAsync(cancellationToken);

        return rows.Select(r => (r.Name, r.Value)).ToList();
    }

    public async Task<IReadOnlyList<Part>> ListWithCategoryOrderByNameTakeAsync(int take, CancellationToken cancellationToken = default)
    {
        var list = await _db.Parts
            .AsNoTracking()
            .Include(p => p.Category)
            .OrderBy(p => p.Name)
            .Take(take)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<(string Category, int TotalItems, decimal ValueNum)>> AggregateInventoryByCategoryAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _db.Parts
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.Category != null)
            .GroupBy(p => p.Category!.Name)
            .Select(g => new
            {
                Category = g.Key,
                TotalItems = g.Sum(x => x.StockQty),
                ValueNum = g.Sum(x => x.UnitPrice * x.StockQty)
            })
            .ToListAsync(cancellationToken);

        return rows.Select(r => (r.Category, r.TotalItems, r.ValueNum)).ToList();
    }
}
               