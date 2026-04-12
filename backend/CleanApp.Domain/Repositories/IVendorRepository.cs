using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface IVendorRepository
{
    Task<IReadOnlyList<Vendor>> ListOrderedByNameAsync(CancellationToken cancellationToken = default);
    Task<Vendor?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Part>> ListPartsByVendorIdAsync(Guid vendorId, CancellationToken cancellationToken = default);
    void Add(Vendor vendor);
    void Remove(Vendor vendor);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
                 