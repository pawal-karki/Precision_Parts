using CleanApp.Application.Demo;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.CustomerPortal;

public class CustomerAiService : ICustomerAiService
{
    private readonly IAiPredictionRepository _predictions;
    private readonly IDemoContentProvider _demo;

    public CustomerAiService(IAiPredictionRepository predictions, IDemoContentProvider demo)
    {
        _predictions = predictions;
        _demo = demo;
    }

    public async Task<IReadOnlyList<CustomerPredictionRow>> GetPredictionsAsync(CancellationToken cancellationToken = default)
    {
        var preds = await _predictions.ListWithVehicleOrderedByCreatedAsync(cancellationToken);
        if (preds.Count == 0)
            return Array.Empty<CustomerPredictionRow>();

        return preds.Select((p, idx) =>
        {
            var v = p.Vehicle;
            var vehicleLabel = v == null
                ? "—"
                : v.Nickname ?? $"{v.Year} {v.Make} {v.Model}".Trim();
            return new CustomerPredictionRow(
                idx + 1,
                p.PredictionType,
                vehicleLabel,
                p.RiskLevel ?? "Low",
                (int)(p.ConfidenceScore ?? 0),
                p.PredictedForDate.HasValue ? $"Target {p.PredictedForDate:yyyy-MM-dd}" : "—",
                p.Recommendation ?? "");
        }).ToList();
    }

    public IReadOnlyList<object> GetMaintenanceTrend() => _demo.MaintenanceTrend;
}
