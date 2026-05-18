using System.Collections.Generic;
using CleanApp.Application.Admin;

namespace CleanApp.Application.Demo;

public record PurchaseInvoiceItemDto(string Name, string Sku, int Qty, double UnitPrice, double Total);

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
    void AddInvoice(string id, string vendor, string date, string status, double subtotal, double tax, double total, List<PurchaseInvoiceItemDto> items);
}
