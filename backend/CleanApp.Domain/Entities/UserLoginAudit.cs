namespace CleanApp.Domain.Entities;

/// <summary>Successful sign-in audit (IP from request, typically public when behind a reverse proxy).</summary>
public class UserLoginAudit
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime OccurredAtUtc { get; set; }
    /// <summary>Client IP (first X-Forwarded-For entry, X-Real-IP, or remote address).</summary>
    public string IpAddress { get; set; } = "";
    public string? UserAgent { get; set; }

    public User User { get; set; } = null!;
}
