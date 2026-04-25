namespace CleanApp.Application.Vendors;

public interface IVendorsService
{
    Task<IReadOnlyList<VendorAdminRowDto>> ListForAdminAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(VendorCreateDto dto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, VendorUpdateDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
