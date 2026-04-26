using CleanApp.Application.Admin;

namespace CleanApp.Application.Demo;

public interface IDemoContentProvider
{
    IReadOnlyList<object> PurchaseInvoices { get; }
    IReadOnlyList<object> ActivityLedger { get; }
    IReadOnlyList<object> AuditLog { get; }
    IReadOnlyList<object> MaintenanceTrend { get; }
    IReadOnlyList<object> FinancialReportRows { get; }
    IReadOnlyList<InventoryReportRowDto> InventoryReportFallback { get; }
    object SampleInvoice { get; }
    void ApproveInvoice(string id);
}
