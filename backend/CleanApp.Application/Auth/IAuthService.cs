namespace CleanApp.Application.Auth;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<AuthResponseDto?> GetUserByIdAsync(Guid userId, CancellationToken ct = default);
}
