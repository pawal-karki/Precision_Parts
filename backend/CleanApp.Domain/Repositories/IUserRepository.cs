using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IUserRepository
{
    Task<IReadOnlyList<User>> ListStaffOrderedByNameAsync(CancellationToken cancellationToken = default);
    Task<User?> GetFirstAdminAsync(CancellationToken cancellationToken = default);
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(User user);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
     