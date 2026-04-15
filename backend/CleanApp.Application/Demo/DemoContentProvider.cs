using CleanApp.Application.Admin;

namespace CleanApp.Application.Demo;

public sealed class DemoContentProvider : IDemoContentProvider
{
    public IReadOnlyList<object> PurchaseInvoices { get; } =
    [
        (object)new
        {
            id = "PO-2024-001",
            vendor = "Euro Precision GmbH",
            date = "2024-03-10",
            status = "Completed",
            items = new object[]
            {
                new { name = "Titanium Valve Cap", sku = "VC-9921-T", qty = 500, unitPrice = 22.0, total = 11000 },
                new { name = "Hub Bolt Kit", sku = "HBK-011", qty = 200, unitPrice = 7.5, total = 1500 }
            },
            subtotal = 12500,
            tax = 2500,
            total = 15000
        },
        new
        {
            id = "PO-2024-002",
            vendor = "Brembo SpA",
            date = "2024-03-12",
            status = "Pending",
            items = new object[]
            {
                new { name = "Carbon Ceramic Brake Rotor", sku = "BR-CCR-08", qty = 100, unitPrice = 165.0, total = 16500 },
                new { name = "Brembo Pro Caliper Blue", sku = "CL-BPB-02", qty = 50, unitPrice = 380.0, total = 19000 }
            },
            subtotal = 35500,
            tax = 7100,
            total = 42600
        }
    ];

    public IReadOnlyList<object> AuditLog { get; } = DemoAuditLogData.Rows;

    public IReadOnlyList<object> ActivityLedger { get; } =
    [
        (object)new { id = 1, timestamp = "14:22 | 12 Oct 23", type = "INVENTORY_ADD", badge = "default", description = "Added 150x Precision Camshafts (Steel-4)", reference = "TRX-94821" },
        new { id = 2, timestamp = "11:05 | 12 Oct 23", type = "SALE_COMPLETED", badge = "primary", description = "Bulk order: Horizon Motorsport (42 items)", reference = "INV-22941" },
        new { id = 3, timestamp = "09:15 | 12 Oct 23", type = "STOCK_ADJUST", badge = "tertiary", description = "Manual audit adjustment for Warehouse B, Row 4", reference = "AUD-00122" },
        new { id = 4, timestamp = "08:45 | 12 Oct 23", type = "AUTH_ALERT", badge = "error", description = "Failed login attempt from unauthorized IP: 192.168.1.42", reference = "SEC-99120" }
    ];

    public IReadOnlyList<object> MaintenanceTrend { get; } =
    [
        (object)new { month = "Aug", score = 95 },
        new { month = "Sep", score = 92 },
        new { month = "Oct", score = 88 },
        new { month = "Nov", score = 85 },
        new { month = "Dec", score = 82 },
        new { month = "Jan", score = 80 },
        new { month = "Feb", score = 78 },
        new { month = "Mar", score = 76 }
    ];

    public IReadOnlyList<InventoryReportRowDto> InventoryReportFallback { get; } =
    [
        new("Engine", 1624, "$245,320", "4.2x"),
        new("Brakes", 695, "$198,450", "3.8x"),
        new("Fasteners", 50, "$4,250", "6.1x"),
        new("Lubricants", 450, "$5,400", "8.5x"),
        new("Transmission", 290, "$45,240", "3.2x"),
        new("Suspension", 180, "$32,400", "2.9x")
    ];

    public IReadOnlyList<object> FinancialReportRows { get; } =
    [
        (object)new { id = 1, period = "Q1 2024", revenue = "$125,430", expenses = "$78,200", profit = "$47,230", margin = "37.6%" },
        new { id = 2, period = "Q4 2023", revenue = "$148,200", expenses = "$92,100", profit = "$56,100", margin = "37.8%" },
        new { id = 3, period = "Q3 2023", revenue = "$132,800", expenses = "$85,400", profit = "$47,400", margin = "35.6%" },
        new { id = 4, period = "Q2 2023", revenue = "$118,500", expenses = "$76,750", profit = "$41,750", margin = "35.2%" }
    ];

    public object SampleInvoice { get; } = new
    {
        id = "INV-22941",
        date = "March 12, 2024",
        dueDate = "April 12, 2024",
        customer = new
        {
            name = "Horizon Motorsport",
            address = "1452 Performance Drive, Unit 7B\nDetroit, MI 48201",
            email = "orders@horizonms.com"
        },
        company = new
        {
            name = "Precision Parts",
            address = "Unit 14, Industrial Quarter\nBirmingham, B5 4TN",
            email = "accounts@precision-parts.com"
        },
        items = new object[]
        {
            new { name = "V8 Intake Manifold X-9", sku = "IM-V8X9", qty = 12, unitPrice = 345.0, total = 4140.0 },
            new { name = "Carbon Ceramic Brake Rotor", sku = "BR-CCR-08", qty = 20, unitPrice = 189.0, total = 3780.0 },
            new { name = "Brembo Pro Caliper Blue", sku = "CL-BPB-02", qty = 10, unitPrice = 425.0, total = 4250.0 }
        },
        subtotal = 12170.0,
        loyaltyDiscount = 1217.0,
        tax = 2190.6,
        total = 13143.6,
        loyaltyApplied = true
    };
}
