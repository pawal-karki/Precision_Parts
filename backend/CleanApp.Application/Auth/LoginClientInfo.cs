namespace CleanApp.Application.Auth;

/// <summary>HTTP client metadata captured at sign-in (public IP when reverse proxy forwards X-Forwarded-For).</summary>
public sealed record LoginClientInfo(string? IpAddress, string? UserAgent);
