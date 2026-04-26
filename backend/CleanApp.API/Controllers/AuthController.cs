using System.Security.Claims;
using CleanApp.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(dto, ct);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password" });

        SetAuthCookie(result.Token!);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(dto, ct);
        if (result is null)
            return Conflict(new { message = "An account with this email already exists" });

        SetAuthCookie(result.Token!);
        return Ok(result);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("pp_auth", new CookieOptions
        {
            Path = "/",
            SameSite = SameSiteMode.None,
            Secure = true
        });
        return Ok(new { message = "Logged out" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        if (sub is null || !Guid.TryParse(sub, out var userId))
            return Unauthorized();

        var result = await _auth.GetUserByIdAsync(userId, ct);
        if (result is null) return Unauthorized();
        return Ok(result);
    }

    [HttpPost("request-reset")]
    public async Task<IActionResult> RequestReset([FromBody] RequestResetDto dto, CancellationToken ct)
    {
        var (success, message) = await _auth.RequestPasswordResetAsync(dto.Email, ct);
        if (!success) 
            return BadRequest(new { message });
        
        return Ok(new { message });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto, CancellationToken ct)
    {
        var result = await _auth.VerifyOtpAsync(dto.Email, dto.Otp, ct);
        if (!result) return BadRequest(new { message = "Invalid or expired verification code." });
        
        return Ok(new { message = "Code verified successfully." });
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequestDto dto, CancellationToken ct)
    {
        var result = await _auth.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword, ct);
        if (!result) return BadRequest(new { message = "Invalid email, OTP, or expired code." });

        return Ok(new { message = "Password has been successfully reset." });
    }

    private void SetAuthCookie(string token)
    {
        Response.Cookies.Append("pp_auth", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true, // Required for cross-site cookie transmission
            Expires = DateTimeOffset.UtcNow.AddDays(1),
            Path = "/"
        });
    }
}

public record RequestResetDto(string Email);
public record VerifyOtpDto(string Email, string Otp);
public record ResetPasswordRequestDto(string Email, string Otp, string NewPassword);
