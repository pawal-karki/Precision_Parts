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

    /// <summary>Returns full CRM aggregate: profile, vehicles, last 5 invoices, appointment count, part-request count.</summary>
    Task<User?> GetCustomerFullCrmAsync(int publicId, CancellationToken cancellationToken = default);

    /// <summary>Paginated activity stream: appointments + invoices + part-requests sorted by date desc.</summary>
    Task<(List<Appointment> appointments, List<Invoice> invoices, List<PartRequest> partRequests)>
        GetActivityDataAsync(Guid userId, CancellationToken cancellationToken = default);

    void Add(User user);
    void AddProfile(CustomerProfile profile);
    void AddVehicle(Vehicle vehicle);
    void RemoveVehicles(IEnumerable<Vehicle> vehicles);
    void Remove(User user);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
      