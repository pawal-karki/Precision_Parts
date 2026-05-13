using System.Text.Json.Serialization;

namespace CleanApp.Application.CustomerPortal;

public record CustomerVehicleRow(int Id, string Name, string Vin, string Mileage, string LastService, int HealthScore);

public record CustomerActivityRow(int Id, string Type, string Description, string Date, string Amount);

public record CustomerDashboardDto(
    string TotalSpent,
    string PendingPayments,
    int ActiveOrders,
    int LoyaltyPoints,
    IReadOnlyList<CustomerVehicleRow> Vehicles,
    IReadOnlyList<CustomerActivityRow> RecentActivity);

public record InvoiceItemDto(
    string Description,
    string ItemType,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public record CustomerOrderRow(
    string OrderNumber,
    string OrderDate,
    string DeliveryDate,
    string ItemsSummary,
    string AmountStr,
    decimal TotalAmount,
    string Status,
    List<InvoiceItemDto> Items);

public record LoyaltyStatusDto(
    [property: JsonPropertyName("totalSpent")] decimal TotalSpent,
    [property: JsonPropertyName("loyaltyTier")] string LoyaltyTier,
    [property: JsonPropertyName("loyaltyPoints")] int LoyaltyPoints,
    [property: JsonPropertyName("discountEligible")] bool DiscountEligible,
    [property: JsonPropertyName("maxSingleOrderAmount")] decimal MaxSingleOrderAmount,
    [property: JsonPropertyName("discountPercent")] int DiscountPercent);

public record OrderItemDto(
    [property: JsonPropertyName("sku")] string Sku,
    [property: JsonPropertyName("quantity")] decimal Quantity);

public record CreateCustomerOrderDto(
    [property: JsonPropertyName("items")] List<OrderItemDto> Items);

public record CustomerPredictionRow(int Id, string Component, string Vehicle, string RiskLevel, int Confidence, string EstimatedFailure, string Recommendation);

public record CustomerLedgerDto(
    decimal TotalOutstandingBalance,
    IReadOnlyList<CustomerInvoiceDto> PendingInvoices,
    IReadOnlyList<CustomerActivityRow> RecentActivity);

public record CustomerInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    decimal TotalAmount,
    decimal BalanceDue,
    string IssueDate,
    string DueDate,
    string Status,
    List<InvoiceItemDto> Items);
