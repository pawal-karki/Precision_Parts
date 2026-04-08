namespace CleanApp.Domain.Entities;

public class Part : BaseEntity
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? CategoryId { get; set; }
    public Guid? VendorId { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public int StockQty { get; set; }
    public int ReorderLevel { get; set; } = 10;
    public bool IsActive { get; set; } = true;
    public string? BatchCode { get; set; }
    public string? UnitOfMeasure { get; set; }
    public string? WarehouseLocation { get; set; }

    public PartCategory? Category { get; set; }
    public Vendor? Vendor { get; set; }
}
      