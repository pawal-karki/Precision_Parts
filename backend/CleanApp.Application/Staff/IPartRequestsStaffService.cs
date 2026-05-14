namespace CleanApp.Application.Staff;

public interface IPartRequestsStaffService
{
    Task<IReadOnlyList<StaffPartRequestListItemDto>> ListAsync(CancellationToken cancellationToken = default);

    Task UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}
