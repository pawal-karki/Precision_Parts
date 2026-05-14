using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Staff;

public class PartRequestsStaffService : IPartRequestsStaffService
{
    private readonly ICustomerRepository _customers;

    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Pending", "Sourcing", "Available", "Cancelled"
    };

    public PartRequestsStaffService(ICustomerRepository customers) => _customers = customers;

    public async Task<IReadOnlyList<StaffPartRequestListItemDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var list = await _customers.ListAllPartRequestsForStaffAsync(cancellationToken);
        return list.Select(pr => new StaffPartRequestListItemDto
        {
            Id = pr.Id,
            CustomerPublicId = pr.Customer.PublicId,
            CustomerName = pr.Customer.FullName,
            CustomerEmail = pr.Customer.Email,
            PartName = pr.PartName,
            PartNumber = pr.PartNumber,
            VehicleModel = pr.VehicleModel,
            Description = pr.Description,
            Urgency = pr.Urgency,
            Status = pr.Status,
            CreatedAtUtc = pr.CreatedAtUtc
        }).ToList();
    }

    public async Task UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var trimmed = (status ?? "").Trim();
        if (string.IsNullOrEmpty(trimmed) || !AllowedStatuses.Contains(trimmed))
            throw new ArgumentException("Invalid status. Use Pending, Sourcing, Available, or Cancelled.");

        var pr = await _customers.GetPartRequestByIdForUpdateAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Part request not found.");

        pr.Status = AllowedStatuses.First(s => string.Equals(s, trimmed, StringComparison.OrdinalIgnoreCase));
        await _customers.SaveChangesAsync(cancellationToken);
    }
}
