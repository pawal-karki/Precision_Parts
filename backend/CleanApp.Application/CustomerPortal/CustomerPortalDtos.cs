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

public record CustomerOrderRow(string Id, string Date, string Items, string Total, string Status);


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
    string? DueDate,
    string Status);
