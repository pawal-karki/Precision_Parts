namespace CleanApp.Application.Auth;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<AuthResponseDto?> GetUserByIdAsync(Guid userId, CancellationToken ct = default);
    Task<(bool Success, string Message)> RequestPasswordResetAsync(string email, CancellationToken ct = default);
    Task<bool> VerifyOtpAsync(string email, string otp, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(string email, string otp, string newPassword, CancellationToken ct = default);
}
