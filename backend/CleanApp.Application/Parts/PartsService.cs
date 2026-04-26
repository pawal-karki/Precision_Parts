using CleanApp.Domain.Entities;
using CleanApp.Domain.Repositories;
using CleanApp.Domain.Services;

namespace CleanApp.Application.Parts;

public class PartsService : IPartsService
{
    private readonly IPartRepository _parts;

    public PartsService(IPartRepository parts) => _parts = parts;

    public async Task<IReadOnlyList<PartAdminRowDto>> ListForAdminAsync(CancellationToken cancellationToken = default)
    {
        var list = await _parts.ListWithCategoryAndVendorOrderedBySkuAsync(cancellationToken);
        var idx = 0;
        return list.Select(p =>
        {
            var level = PartInventoryRules.Classify(p);
            return new PartAdminRowDto
            {
                Id = ++idx,
                Name = p.Name,
                Sku = p.Sku,
                Batch = p.BatchCode ?? "—",
                Stock = p.StockQty,
                Unit = p.UnitOfMeasure ?? "pcs",
                Status = PartInventoryRules.ToDisplayStatus(level),
                Category = p.Category?.Name ?? "Uncategorized",
                Price = (double)p.UnitPrice,
                Vendor = p.Vendor?.Name ?? "—",
                MinStock = p.ReorderLevel,
                Location = p.WarehouseLocation ?? "—",
                ImageUrl = p.ImageUrl,
                EntityId = p.Id
            };
        }).ToList();
    }

    public async Task<Guid> CreateAsync(PartCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Sku) || string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Sku and Name are required.");

        if (await _parts.ExistsBySkuAsync(dto.Sku.Trim(), cancellationToken))
            throw new InvalidOperationException($"Part with SKU '{dto.Sku}' already exists.");

        var entity = new Part
        {
            Sku = dto.Sku.Trim(),
            Name = dto.Name.Trim(),
            CategoryId = dto.CategoryId,
            VendorId = dto.VendorId,
            UnitPrice = dto.UnitPrice,
            StockQty = dto.StockQty,
            ReorderLevel = dto.ReorderLevel,
            BatchCode = dto.BatchCode,
            UnitOfMeasure = dto.UnitOfMeasure,
            WarehouseLocation = dto.WarehouseLocation,
            ImageUrl = dto.ImageUrl,
            IsActive = true
        };
        _parts.Add(entity);
        await _parts.SaveChangesAsync(cancellationToken);
        return entity.Id;
    }

    public async Task UpdateAsync(Guid id, PartUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _parts.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Part not found.");

        if (!string.IsNullOrWhiteSpace(dto.Sku)) entity.Sku = dto.Sku.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Name)) entity.Name = dto.Name.Trim();
        if (dto.CategoryId.HasValue) entity.CategoryId = dto.CategoryId;
        if (dto.VendorId.HasValue) entity.VendorId = dto.VendorId;
        if (dto.UnitPrice.HasValue) entity.UnitPrice = dto.UnitPrice.Value;
        if (dto.StockQty.HasValue) entity.StockQty = dto.StockQty.Value;
        if (dto.ReorderLevel.HasValue) entity.ReorderLevel = dto.ReorderLevel.Value;
        if (dto.BatchCode != null) entity.BatchCode = dto.BatchCode;
        if (dto.UnitOfMeasure != null) entity.UnitOfMeasure = dto.UnitOfMeasure;
        if (dto.WarehouseLocation != null) entity.WarehouseLocation = dto.WarehouseLocation;
        if (dto.ImageUrl != null) entity.ImageUrl = dto.ImageUrl;

        entity.UpdatedAtUtc = DateTime.UtcNow;
        await _parts.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _parts.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Part not found.");
        _parts.Remove(entity);
        await _parts.SaveChangesAsync(cancellationToken);
    }
}
   