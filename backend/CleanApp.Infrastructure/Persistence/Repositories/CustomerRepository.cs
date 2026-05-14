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

    public Task<User?> GetCustomerByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(u => u.CustomerProfile)
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Customer, cancellationToken);

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

    public Task<CustomerProfile?> GetProfileByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.CustomerProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == id, cancellationToken);

    public Task UpdateProfileAsync(CustomerProfile profile, CancellationToken cancellationToken = default)
    {
        _db.CustomerProfiles.Update(profile);
        return Task.CompletedTask;
    }

    public Task<User?> GetCustomerFullCrmAsync(int publicId, CancellationToken cancellationToken = default) =>
        _db.Users
            .Include(u => u.CustomerProfile)
            .Include(u => u.Vehicles)
            .Include(u => u.Invoices.OrderByDescending(i => i.IssueDate).Take(5))
            .Include(u => u.Appointments)
            .FirstOrDefaultAsync(u => u.PublicId == publicId && u.Role == UserRole.Customer, cancellationToken);

    public async Task<(List<Appointment> appointments, List<Invoice> invoices, List<PartRequest> partRequests)>
        GetActivityDataAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var appointments = await _db.Appointments
            .AsNoTracking()
            .Where(a => a.CustomerId == userId)
            .OrderByDescending(a => a.ScheduledAtUtc)
            .ToListAsync(cancellationToken);

        var invoices = await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.CustomerId == userId)
            .OrderByDescending(i => i.IssueDate)
            .ToListAsync(cancellationToken);

        var partRequests = await _db.PartRequests
            .AsNoTracking()
            .Where(pr => pr.CustomerId == userId)
            .OrderByDescending(pr => pr.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return (appointments, invoices, partRequests);
    }

    public async Task<Dictionary<Guid, int>> GetPartRequestCountsByCustomerIdAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _db.PartRequests
            .AsNoTracking()
            .GroupBy(pr => pr.CustomerId)
            .Select(g => new { CustomerId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        return rows.ToDictionary(x => x.CustomerId, x => x.Count);
    }

    public async Task<IReadOnlyList<PartRequest>> ListPartRequestsForCustomerAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        await _db.PartRequests
            .AsNoTracking()
            .Where(pr => pr.CustomerId == customerId)
            .OrderByDescending(pr => pr.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PartRequest>> ListAllPartRequestsForStaffAsync(CancellationToken cancellationToken = default) =>
        await _db.PartRequests
            .AsNoTracking()
            .Include(pr => pr.Customer)
            .OrderByDescending(pr => pr.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<PartRequest?> GetPartRequestByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        _db.PartRequests
            .Include(pr => pr.Customer)
            .FirstOrDefaultAsync(pr => pr.Id == id, cancellationToken);

    public void AddUserLoginAudit(UserLoginAudit audit) => _db.UserLoginAudits.Add(audit);

    public async Task<(IReadOnlyList<UserLoginAudit> Items, int TotalCount)> ListUserLoginAuditsAsync(
        Guid userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var q = _db.UserLoginAudits.AsNoTracking().Where(a => a.UserId == userId);
        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(a => a.OccurredAtUtc)
            .ThenByDescending(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<Guid?> GetLatestUserLoginAuditIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _db.UserLoginAudits.AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.OccurredAtUtc)
            .ThenByDescending(a => a.Id)
            .Select(a => (Guid?)a.Id)
            .FirstOrDefaultAsync(cancellationToken);

    public void Add(User user) => _db.Users.Add(user);

    public void AddProfile(CustomerProfile profile) => _db.CustomerProfiles.Add(profile);

    public void AddVehicle(Vehicle vehicle) => _db.Vehicles.Add(vehicle);

    public void RemoveVehicles(IEnumerable<Vehicle> vehicles) => _db.Vehicles.RemoveRange(vehicles);

    public void Remove(User user) => _db.Users.Remove(user);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}
