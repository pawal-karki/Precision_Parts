using System.Security.Claims;
using CleanApp.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Handles authentication and identity management for all user roles (Admin, Staff, Customer).
/// Provides endpoints for login, registration, logout, profile retrieval,
/// and the OTP-based password reset flow.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    /// <summary>
    /// Initializes a new instance of <see cref="AuthController"/> with the required authentication service.
    /// </summary>
    /// <param name="auth">The service responsible for authentication and identity operations.</param>
    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>
    /// Authenticates a user with their email and password credentials.
    /// On success, issues a JWT token stored in an HttpOnly cookie (<c>pp_auth</c>).
    /// Captures the client IP address and User-Agent for login audit purposes.
    /// </summary>
    /// <param name="dto">The login credentials containing email and password.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the authenticated user profile and token on success;
    /// 401 Unauthorized if credentials are invalid.
    /// </returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var ip = ClientIpResolver.GetClientIp(HttpContext);
        var ua = Request.Headers["User-Agent"].ToString();
        var client = new LoginClientInfo(ip, string.IsNullOrEmpty(ua) ? null : ua);
        var result = await _auth.LoginAsync(dto, client, ct);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password" });

        SetAuthCookie(result.Token!);
        return Ok(result);
    }

    /// <summary>
    /// Registers a new customer account with the provided details.
    /// On success, issues a JWT token stored in an HttpOnly cookie (<c>pp_auth</c>).
    /// </summary>
    /// <param name="dto">The registration data including name, email, and password.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the registered user profile and token on success;
    /// 409 Conflict if an account with the provided email already exists.
    /// </returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(dto, ct);
        if (result is null)
            return Conflict(new { message = "An account with this email already exists" });

        SetAuthCookie(result.Token!);
        return Ok(result);
    }

    /// <summary>
    /// Terminates the current authenticated session by clearing the <c>pp_auth</c> cookie.
    /// </summary>
    /// <returns>A 200 OK response confirming the user has been logged out.</returns>
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

    /// <summary>
    /// Retrieves the profile of the currently authenticated user based on their JWT claims.
    /// Requires a valid authentication token.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the authenticated user's profile on success;
    /// 401 Unauthorized if the token is invalid or the user cannot be resolved.
    /// </returns>
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

    /// <summary>
    /// Initiates the password reset flow by sending a one-time password (OTP) to the
    /// user's registered email address. The OTP expires after a defined period.
    /// </summary>
    /// <param name="dto">The request containing the user's registered email address.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a confirmation message on success;
    /// 400 Bad Request if the email is not associated with any account or delivery fails.
    /// </returns>
    [HttpPost("request-reset")]
    public async Task<IActionResult> RequestReset([FromBody] RequestResetDto dto, CancellationToken ct)
    {
        var (success, message) = await _auth.RequestPasswordResetAsync(dto.Email, ct);
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    /// <summary>
    /// Verifies the OTP code sent to the user's email during the password reset flow.
    /// Must be called before submitting a new password via <see cref="Reset"/>.
    /// </summary>
    /// <param name="dto">The verification request containing the email address and OTP code.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a success message if the OTP is valid;
    /// 400 Bad Request if the OTP is invalid or has expired.
    /// </returns>
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto, CancellationToken ct)
    {
        var result = await _auth.VerifyOtpAsync(dto.Email, dto.Otp, ct);
        if (!result) return BadRequest(new { message = "Invalid or expired verification code." });

        return Ok(new { message = "Code verified successfully." });
    }

    /// <summary>
    /// Completes the password reset flow by setting a new password after OTP verification.
    /// The provided OTP must match the one previously issued via <see cref="RequestReset"/>.
    /// </summary>
    /// <param name="dto">The reset request containing the email, verified OTP, and new password.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a success message if the password was reset successfully;
    /// 400 Bad Request if the email, OTP, or combination is invalid or expired.
    /// </returns>
    [HttpPost("reset")]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequestDto dto, CancellationToken ct)
    {
        var result = await _auth.ResetPasswordAsync(dto.Email, dto.Otp, dto.NewPassword, ct);
        if (!result) return BadRequest(new { message = "Invalid email, OTP, or expired code." });

        return Ok(new { message = "Password has been successfully reset." });
    }

    /// <summary>
    /// Appends a secure, HttpOnly JWT authentication cookie (<c>pp_auth</c>) to the response.
    /// The cookie is configured with SameSite=None and Secure=true to support cross-origin
    /// requests from the frontend. It expires after 24 hours.
    /// </summary>
    /// <param name="token">The JWT bearer token string to embed in the cookie.</param>
    private void SetAuthCookie(string token)
    {
        Response.Cookies.Append("pp_auth", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true, // Required for cross-site cookie transmission
            Expires = DateTimeOffset.UtcNow.AddDays(1),
            IsEssential = true,
            Path = "/"
        });
    }
}

/// <summary>Represents the request payload for initiating a password reset.</summary>
/// <param name="Email">The registered email address of the user requesting a password reset.</param>
public record RequestResetDto(string Email);

/// <summary>Represents the request payload for OTP verification during password reset.</summary>
/// <param name="Email">The registered email address of the user.</param>
/// <param name="Otp">The one-time password code received via email.</param>
public record VerifyOtpDto(string Email, string Otp);

/// <summary>Represents the request payload for completing a password reset.</summary>
/// <param name="Email">The registered email address of the user.</param>
/// <param name="Otp">The verified one-time password code.</param>
/// <param name="NewPassword">The new password to set for the account.</param>
public record ResetPasswordRequestDto(string Email, string Otp, string NewPassword);
