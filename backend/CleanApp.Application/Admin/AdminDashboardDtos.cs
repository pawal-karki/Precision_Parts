namespace CleanApp.Application.Admin;

public record KpiMetricDto(string Value, string Trend, string Type);

public record AdminKpisDto(
    KpiMetricDto TotalRevenue,
    KpiMetricDto TotalSales,
    KpiMetricDto ActiveCustomers,
    KpiMetricDto LowStockItems);

public record RevenueChartPoint(string Month, double Actual, double Projected);

public record CategoryDistributionSlice(string Name, int Value);

public record TopSellingPartRow(string Name, int Units, int Percentage);

public record AdminAlertRow(int Id, string Type, string Severity, string Title, string Description, string Action);
   