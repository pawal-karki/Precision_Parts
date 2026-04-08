using CleanApp.Domain.Entities;
using CleanApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence.Repositories;

public class AiPredictionRepository : IAiPredictionRepository
{
    private readonly AppDbContext _db;

    public AiPredictionRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<AiPrediction>> ListWithVehicleOrderedByCreatedAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.AiPredictions
            .AsNoTracking()
            .Include(a => a.Vehicle)
            .OrderBy(a => a.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        return list;
    }
}
    