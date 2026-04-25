using CleanApp.Domain.Entities;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Vendors;

public class VendorsService : IVendorsService
{
    private readonly IVendorRepository _repository;

    public VendorsService(IVendorRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<VendorAdminRowDto>> ListForAdminAsync(CancellationToken cancellationToken = default)
    {
        var vendors = await _repository.ListOrderedByNameAsync(cancellationToken);
        
        var dtos = new List<VendorAdminRowDto>();
        foreach (var v in vendors)
        {
            dtos.Add(new VendorAdminRowDto(
                v.Id,
                v.Name,
                v.ContactName,
                v.Email,
                v.Phone,
                v.City,
                v.Country,
                v.Rating,
                v.Parts.Count,
                v.IsActive
            ));
        }
        
        return dtos;
    }

    public async Task<Guid> CreateAsync(VendorCreateDto dto, CancellationToken cancellationToken = default)
    {
        var vendor = new Vendor
        {
            Name = dto.Name,
            ContactName = dto.ContactName,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            Rating = dto.Rating,
            IsActive = true
        };

        _repository.Add(vendor);
        await _repository.SaveChangesAsync(cancellationToken);
        
        return vendor.Id;
    }

    public async Task UpdateAsync(Guid id, VendorUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var vendor = await _repository.GetByIdAsync(id, cancellationToken);
        if (vendor == null) throw new KeyNotFoundException("Vendor not found");

        vendor.Name = dto.Name;
        vendor.ContactName = dto.ContactName;
        vendor.Email = dto.Email;
        vendor.Phone = dto.Phone;
        vendor.Address = dto.Address;
        vendor.City = dto.City;
        vendor.Country = dto.Country;
        vendor.Rating = dto.Rating;
        vendor.IsActive = dto.IsActive;

        await _repository.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vendor = await _repository.GetByIdAsync(id, cancellationToken);
        if (vendor == null) throw new KeyNotFoundException("Vendor not found");

        _repository.Remove(vendor);
        await _repository.SaveChangesAsync(cancellationToken);
    }
}
