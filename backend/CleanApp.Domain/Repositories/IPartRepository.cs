using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IPartRepository
{
    Task<IReadOnlyList<Part>> ListWithCategoryAndVendorOrderedBySkuAsync(CancellationToken cancellationToken = default);
    Task<Part?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsBySkuAsync(string sku, CancellationToken cancellationToken = default);
    void Add(Part part);
    void Remove(Part part);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<int> CountBelowStockThresholdAsync(int threshold, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Part>> ListBelowReorderLevelTakeAsync(int take, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Part>> TopByStockQtyTakeAsync(int take, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<(string Name, int StockQty)>> GetCategoryStockDistributionTopAsync(int take, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Part>> ListWithCategoryOrderByNameTakeAsync(int take, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<(string Category, int TotalItems, decimal ValueNum)>> AggregateInventoryByCategoryAsync(CancellationToken cancellationToken = default);
}
             