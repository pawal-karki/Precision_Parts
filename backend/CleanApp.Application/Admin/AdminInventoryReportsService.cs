using System.Globalization;
using CleanApp.Application.Demo;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Admin;

public class AdminInventoryReportsService : IAdminInventoryReportsService
{
    private readonly IPartRepository _parts;
    private readonly IDemoContentProvider _demo;

    public AdminInventoryReportsService(IPartRepository parts, IDemoContentProvider demo)
    {
        _parts = parts;
        _demo = demo;
    }

    public async Task<IReadOnlyList<InventoryReportRowDto>> GetReportsAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _parts.AggregateInventoryByCategoryAsync(cancellationToken);
        if (rows.Count == 0)
            return _demo.InventoryReportFallback.ToList();

        var max = rows.Max(r => r.TotalItems);
        return rows.Select(r => new InventoryReportRowDto(
            r.Category,
            r.TotalItems,
            "$" + r.ValueNum.ToString("N0", CultureInfo.InvariantCulture),
            max == 0 ? "0x" : $"{Math.Round(8.0 * r.TotalItems / max, 1)}x")).ToList();
    }
}
          