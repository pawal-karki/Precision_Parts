using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IAiPredictionRepository
{
    Task<IReadOnlyList<AiPrediction>> ListWithVehicleOrderedByCreatedAsync(CancellationToken cancellationToken = default);
}
     