using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;
using System.Globalization;

namespace CleanApp.Application.Admin;

public record StaffListRowDto(Guid EntityId, int Id, string Name, string Role, string Department, string Status, string Email, string JoinDate, string? Avatar);
public record StaffCreateDto(string FullName, string Email, string Password, string? PositionTitle, string? Department);
public record StaffUpdateDto(string FullName, string Email, string? PositionTitle, string? Department, bool IsActive);

public interface IAdminStaffService
{
    Task<IReadOnlyList<StaffListRowDto>> ListAsync(CancellationToken ct = default);
    Task<Guid> CreateAsync(StaffCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(Guid id, StaffUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class AdminStaffService : IAdminStaffService
{
    private readonly IUserRepository _users;

    public AdminStaffService(IUserRepository users) => _users = users;

    public async Task<IReadOnlyList<StaffListRowDto>> ListAsync(CancellationToken ct = default)
    {
        var staff = await _users.ListStaffOrderedByNameAsync(ct);
        return staff.Select(u => new StaffListRowDto(
            u.Id,
            u.PublicId,
            u.FullName,
            u.PositionTitle ?? "Staff",
            u.Department ?? "General",
            u.IsActive ? "Active" : "Inactive",
            u.Email,
            u.CreatedAtUtc.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            null)).ToList();
    }

    public async Task<Guid> CreateAsync(StaffCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName)) throw new ArgumentException("Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Email)) throw new ArgumentException("Email is required.");
        var existing = await _users.GetByEmailAsync(dto.Email.Trim().ToLower(), ct);
        if (existing != null) throw new InvalidOperationException("Email already in use.");
        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password ?? "Precision@123"),
            Role = UserRole.Staff,
            PositionTitle = dto.PositionTitle,
            Department = dto.Department,
            IsActive = true
        };
        _users.Add(user);
        await _users.SaveChangesAsync(ct);
        return user.Id;
    }

    public async Task UpdateAsync(Guid id, StaffUpdateDto dto, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Staff {id} not found.");
        user.FullName = dto.FullName.Trim();
        user.Email = dto.Email.Trim().ToLower();
        user.PositionTitle = dto.PositionTitle;
        user.Department = dto.Department;
        user.IsActive = dto.IsActive;
        await _users.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Staff {id} not found.");
        user.IsActive = false; // soft delete
        await _users.SaveChangesAsync(ct);
    }
}
    