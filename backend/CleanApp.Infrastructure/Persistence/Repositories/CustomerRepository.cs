using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly AppDbContext _db;

    public CustomerRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<User>> ListCustomersWithProfileAndVehiclesOrderedAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.Users
            .AsNoTracking()
            .Include(u => u.CustomerProfile)
            .Include(u => u.Vehicles)
            .Where(u => u.Role == UserRole.Customer)
            .OrderBy(u => u.FullName)
            .ToListAsync(cancellationToken);
        return list;
    }

    public Task<User?> GetCustomerByPublicIdWithDetailsAsync(int publicId, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(u => u.CustomerProfile)
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.PublicId == publicId && u.Role == UserRole.Customer, cancellationToken);

    public Task<User?> GetCustomerByEmailWithDetailsAsync(string email, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(u => u.CustomerProfile)
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Role == UserRole.Customer && u.Email == email, cancellationToken);

    public Task<bool> EmailExistsNormalizedAsync(string normalizedEmail, CancellationToken cancellationToken = default) =>
        _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

    public Task<int> CountActiveCustomersAsync(CancellationToken cancellationToken = default) =>
        _db.Users.CountAsync(u => u.Role == UserRole.Customer && u.IsActive, cancellationToken);

    public async Task<IReadOnlyList<CustomerProfile>> ListProfilesWithOutstandingCreditTakeAsync(int take, CancellationToken cancellationToken = default)
    {
        var list = await _db.CustomerProfiles
            .AsNoTracking()
            .Include(x => x.User)
            .Where(x => x.OutstandingCredit > 0)
            .OrderByDescending(x => x.OutstandingCredit)
            .Take(take)
            .ToListAsync(cancellationToken);
        return list;
    }

    public void Add(User user) => _db.Users.Add(user);

    public void AddProfile(CustomerProfile profile) => _db.CustomerProfiles.Add(profile);

    public void AddVehicle(Vehicle vehicle) => _db.Vehicles.Add(vehicle);

    public void RemoveVehicles(IEnumerable<Vehicle> vehicles) => _db.Vehicles.RemoveRange(vehicles);

    public void Remove(User user) => _db.Users.Remove(user);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}
    