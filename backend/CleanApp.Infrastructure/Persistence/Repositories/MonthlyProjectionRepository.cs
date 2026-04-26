using CleanApp.Domain.Entities;
using CleanApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence.Repositories;

public class MonthlyProjectionRepository : IMonthlyProjectionRepository
{
    private readonly AppDbContext _db;

    public MonthlyProjectionRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<MonthlyProjection>> ListByYearFromAsync(int year, CancellationToken cancellationToken = default)
    {
        return await _db.MonthlyProjections
            .AsNoTracking()
            .Where(x => x.Year >= year)
            .ToListAsync(cancellationToken);
    }

    public async Task<MonthlyProjection?> GetByYearAndMonthAsync(int year, int month, CancellationToken cancellationToken = default)
    {
        return await _db.MonthlyProjections
            .FirstOrDefaultAsync(x => x.Year == year && x.Month == month, cancellationToken);
    }

    public void Add(MonthlyProjection projection) => _db.MonthlyProjections.Add(projection);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _db.SaveChangesAsync(cancellationToken);
    }
}
