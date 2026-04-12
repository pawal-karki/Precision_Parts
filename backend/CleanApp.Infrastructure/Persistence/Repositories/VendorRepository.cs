using CleanApp.Domain.Entities;
using CleanApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence.Repositories;

public class VendorRepository : IVendorRepository
{
    private readonly AppDbContext _db;

    public VendorRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Vendor>> ListOrderedByNameAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.Vendors.AsNoTracking().OrderBy(v => v.Name).ToListAsync(cancellationToken);
        return list;
    }

    public Task<Vendor?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Vendors.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Part>> ListPartsByVendorIdAsync(Guid vendorId, CancellationToken cancellationToken = default)
    {
        var list = await _db.Parts.Where(x => x.VendorId == vendorId).ToListAsync(cancellationToken);
        return list;
    }

    public void Add(Vendor vendor) => _db.Vendors.Add(vendor);

    public void Remove(Vendor vendor) => _db.Vendors.Remove(vendor);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}
            