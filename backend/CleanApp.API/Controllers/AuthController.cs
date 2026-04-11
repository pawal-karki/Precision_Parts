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
            SameSite = SameSiteMode.Lax,
            Secure = false
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

    private void SetAuthCookie(string token)
    {
        Response.Cookies.Append("pp_auth", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = false, // set true in production with HTTPS
            Expires = DateTimeOffset.UtcNow.AddDays(1),
            Path = "/"
        });
    }
}
