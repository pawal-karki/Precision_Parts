using System;

namespace CleanApp.Application.Customers;

public interface ICustomersService
{
    Task<IReadOnlyList<CustomerListItemDto>> ListForStaffAsync(CancellationToken cancellationToken = default);
    Task<int> CreateAsync(CustomerCreateDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(int publicId, CustomerUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(int publicId, CancellationToken cancellationToken = default);
    Task<CustomerDetailReportDto> GetDetailedReportAsync(int publicId, CancellationToken cancellationToken = default);
    Task<PagedResult<ActivityLogItemDto>> GetActivityLogAsync(int publicId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PagedResult<LoginActivityItemDto>> GetLoginActivityAsync(int publicId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<List<CustomerAppointmentDto>> GetServiceHistoryAsync(int publicId, CancellationToken cancellationToken = default);
    Task<List<RecentPurchaseDto>> GetPurchasesAsync(int publicId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid userId, ProfileUpdateDto dto, CancellationToken cancellationToken = default);
}
