using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface ICustomerRepository
{
    Task<IReadOnlyList<User>> ListCustomersWithProfileAndVehiclesOrderedAsync(CancellationToken cancellationToken = default);
    Task<User?> GetCustomerByPublicIdWithDetailsAsync(int publicId, CancellationToken cancellationToken = default);
    Task<User?> GetCustomerByEmailWithDetailsAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> EmailExistsNormalizedAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<int> CountActiveCustomersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CustomerProfile>> ListProfilesWithOutstandingCreditTakeAsync(int take, CancellationToken cancellationToken = default);
    void Add(User user);
    void AddProfile(CustomerProfile profile);
    void AddVehicle(Vehicle vehicle);
    void RemoveVehicles(IEnumerable<Vehicle> vehicles);
    void Remove(User user);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
      