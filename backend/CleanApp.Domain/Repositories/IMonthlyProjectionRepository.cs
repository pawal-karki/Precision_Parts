using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IMonthlyProjectionRepository
{
    Task<IReadOnlyList<MonthlyProjection>> ListByYearFromAsync(int year, CancellationToken cancellationToken = default);
    Task<MonthlyProjection?> GetByYearAndMonthAsync(int year, int month, CancellationToken cancellationToken = default);
    void Add(MonthlyProjection projection);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
