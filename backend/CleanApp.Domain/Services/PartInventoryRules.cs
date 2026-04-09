using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Services;

/// <summary>Domain rules for inventory classification (no persistence, no UI strings beyond labels).</summary>
public static class PartInventoryRules
{
    public static StockHealthLevel Classify(Part part)
    {
        if (part.StockQty < 10) return StockHealthLevel.Critical;
        if (part.StockQty < part.ReorderLevel) return StockHealthLevel.Low;
        if (part.StockQty < part.ReorderLevel * 2) return StockHealthLevel.Refilling;
        return StockHealthLevel.InStock;
    }

    public static string ToDisplayStatus(StockHealthLevel level) =>
        level switch
        {
            StockHealthLevel.Critical => "Critical",
            StockHealthLevel.Low => "Low Stock",
            StockHealthLevel.Refilling => "Refilling",
            _ => "In Stock"
        };
}

public enum StockHealthLevel
{
    InStock,
    Refilling,
    Low,
    Critical
}
    