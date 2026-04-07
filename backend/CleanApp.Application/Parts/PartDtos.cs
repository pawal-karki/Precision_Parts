namespace CleanApp.Application.Parts;

public class PartAdminRowDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Sku { get; set; } = "";
    public string Batch { get; set; } = "";
    public int Stock { get; set; }
    public string Unit { get; set; } = "pcs";
    public string Status { get; set; } = "";
    public string Category { get; set; } = "";
    public double Price { get; set; }
    public string Vendor { get; set; } = "";
    public int MinStock { get; set; }
    public string Location { get; set; } = "";
    public Guid EntityId { get; set; }
}

public class PartCreateDto
{
    public string Sku { get; set; } = "";
    public string Name { get; set; } = "";
    public Guid? CategoryId { get; set; }
    public Guid? VendorId { get; set; }
    public decimal UnitPrice { get; set; }
    public int StockQty { get; set; }
    public int ReorderLevel { get; set; } = 10;
    public string? BatchCode { get; set; }
    public string? UnitOfMeasure { get; set; }
    public string? WarehouseLocation { get; set; }
}

public class PartUpdateDto
{
    public string? Sku { get; set; }
    public string? Name { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? VendorId { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? StockQty { get; set; }
    public int? ReorderLevel { get; set; }
    public string? BatchCode { get; set; }
    public string? UnitOfMeasure { get; set; }
    public string? WarehouseLocation { get; set; }
}
      