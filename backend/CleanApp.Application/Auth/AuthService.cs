using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CleanApp.Application.Auth;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly ICustomerRepository _customers;
    private readonly JwtSettings _jwt;

    public AuthService(IUserRepository users, ICustomerRepository customers, IOptions<JwtSettings> jwt)
    {
        _users = users;
        _customers = customers;
        _jwt = jwt.Value;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken ct)
    {
        var user = await _users.GetByEmailAsync(dto.Email.ToLowerInvariant(), ct);
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _users.SaveChangesAsync(ct);

        return BuildResponse(user);
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, CancellationToken ct)
    {
        var exists = await _customers.EmailExistsNormalizedAsync(dto.Email.ToLowerInvariant(), ct);
        if (exists) return null;

        var user = new User
        {
            Role = UserRole.Customer,
            FullName = dto.FullName,
            Email = dto.Email.ToLowerInvariant(),
            Phone = dto.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            IsActive = true,
            EmailVerifiedAtUtc = DateTime.UtcNow,
            LastLoginAtUtc = DateTime.UtcNow
        };

        _customers.Add(user);
        await _customers.SaveChangesAsync(ct);

        // Create CustomerProfile
        var profile = new CustomerProfile
        {
            UserId = user.Id,
            LoyaltyTier = "Bronze",
            TotalSpent = 0,
            AccountKind = "Individual",
            AccountStatus = "Active",
            OutstandingCredit = 0
        };
        _customers.AddProfile(profile);
        await _customers.SaveChangesAsync(ct);

        // If vehicle model provided, create a vehicle record
        if (!string.IsNullOrWhiteSpace(dto.VehicleModel))
        {
            var vehicle = new Vehicle
            {
                CustomerId = user.Id,
                Nickname = dto.VehicleModel,
                HealthScore = 100,
                LastServiceDate = DateOnly.FromDateTime(DateTime.UtcNow)
            };
            _customers.AddVehicle(vehicle);
            await _customers.SaveChangesAsync(ct);
        }

        return BuildResponse(user);
    }

    public async Task<AuthResponseDto?> GetUserByIdAsync(Guid userId, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(userId, ct);
        return user is null ? null : BuildResponse(user, includeToken: false);
    }

    private AuthResponseDto BuildResponse(User user, bool includeToken = true)
    {
        var roleName = user.Role switch
        {
            UserRole.Admin => "Admin",
            UserRole.Staff => "Staff",
            _ => "Customer"
        };

        return new AuthResponseDto
        {
            Id = user.Id,
            PublicId = user.PublicId,
            FullName = user.FullName,
            Email = user.Email,
            Role = roleName,
            Token = includeToken ? GenerateJwt(user, roleName) : null
        };
    }

    private string GenerateJwt(User user, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, role),
            new Claim("publicId", user.PublicId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
