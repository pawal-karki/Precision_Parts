using System.Globalization;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Customers;

public class CustomersService : ICustomersService
{
    private readonly ICustomerRepository _customers;

    public CustomersService(ICustomerRepository customers) => _customers = customers;

    public async Task<IReadOnlyList<CustomerListItemDto>> ListForStaffAsync(CancellationToken cancellationToken = default)
    {
        var list = await _customers.ListCustomersWithProfileAndVehiclesOrderedAsync(cancellationToken);
        return list.Select(u =>
        {
            var p = u.CustomerProfile;
            var status = p?.AccountStatus ?? (u.IsActive ? "Active" : "Inactive");
            return new CustomerListItemDto
            {
                Id = u.PublicId,
                Name = u.FullName,
                Type = p?.AccountKind ?? "Individual",
                Email = u.Email,
                Phone = u.Phone ?? "",
                Status = status,
                TotalSpent = "$" + (p?.TotalSpent ?? 0).ToString("N0", CultureInfo.InvariantCulture),
                LoyaltyTier = p?.LoyaltyTier ?? "Bronze",
                Vehicles = u.Vehicles.Select(v => v.Nickname ?? $"{v.Year} {v.Make} {v.Model}".Trim()).Where(s => !string.IsNullOrWhiteSpace(s)).ToList(),
                LastOrder = p?.LastOrderDate?.ToString("yyyy-MM-dd") ?? u.CreatedAtUtc.ToString("yyyy-MM-dd"),
                Credit = (double)(p?.OutstandingCredit ?? 0)
            };
        }).ToList();
    }

    public async Task<int> CreateAsync(CustomerCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
            throw new ArgumentException("Name and Email are required.");

        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _customers.EmailExistsNormalizedAsync(email, cancellationToken))
            throw new InvalidOperationException("A user with this email already exists.");

        var hash = BCrypt.Net.BCrypt.HashPassword("Demo123!");
        var user = new User
        {
            Role = UserRole.Customer,
            FullName = dto.Name.Trim(),
            Email = dto.Email.Trim(),
            Phone = dto.Phone,
            PasswordHash = hash,
            IsActive = dto.Status != "Inactive"
        };
        _customers.Add(user);
        await _customers.SaveChangesAsync(cancellationToken);

        DateOnly? lastOrder = null;
        if (!string.IsNullOrWhiteSpace(dto.LastOrder) && DateOnly.TryParse(dto.LastOrder, out var lo))
            lastOrder = lo;

        var profile = new CustomerProfile
        {
            UserId = user.Id,
            LoyaltyTier = dto.LoyaltyTier,
            TotalSpent = 0,
            AccountKind = dto.Type,
            AccountStatus = dto.Status,
            OutstandingCredit = dto.Credit,
            LastOrderDate = lastOrder
        };
        _customers.AddProfile(profile);

        foreach (var nick in dto.Vehicles.Where(v => !string.IsNullOrWhiteSpace(v)))
            _customers.AddVehicle(new Vehicle { CustomerId = user.Id, Nickname = nick.Trim() });

        await _customers.SaveChangesAsync(cancellationToken);
        return user.PublicId;
    }

    public async Task UpdateAsync(int publicId, CustomerUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByPublicIdWithDetailsAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        if (!string.IsNullOrWhiteSpace(dto.Name)) user.FullName = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email.Trim();
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Status != null)
        {
            user.IsActive = dto.Status != "Inactive";
            if (user.CustomerProfile != null)
                user.CustomerProfile.AccountStatus = dto.Status;
        }

        if (user.CustomerProfile != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Type)) user.CustomerProfile.AccountKind = dto.Type;
            if (!string.IsNullOrWhiteSpace(dto.LoyaltyTier)) user.CustomerProfile.LoyaltyTier = dto.LoyaltyTier;
            if (dto.Credit.HasValue) user.CustomerProfile.OutstandingCredit = dto.Credit.Value;
            if (!string.IsNullOrWhiteSpace(dto.LastOrder) && DateOnly.TryParse(dto.LastOrder, out var lo))
                user.CustomerProfile.LastOrderDate = lo;
        }

        if (dto.Vehicles != null)
        {
            _customers.RemoveVehicles(user.Vehicles);
            foreach (var nick in dto.Vehicles.Where(v => !string.IsNullOrWhiteSpace(v)))
                _customers.AddVehicle(new Vehicle { CustomerId = user.Id, Nickname = nick.Trim() });
        }

        user.UpdatedAtUtc = DateTime.UtcNow;
        await _customers.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int publicId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByPublicIdWithDetailsAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");
        _customers.Remove(user);
        await _customers.SaveChangesAsync(cancellationToken);
    }
}
