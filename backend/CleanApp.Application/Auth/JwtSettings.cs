namespace CleanApp.Application.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public string Key { get; set; } = "PrecisionParts-SuperSecret-Key-Change-In-Production-2026!";
    public string Issuer { get; set; } = "PrecisionParts";
    public string Audience { get; set; } = "PrecisionPartsSPA";
    public int ExpiryMinutes { get; set; } = 1440; // 24 hours
}
