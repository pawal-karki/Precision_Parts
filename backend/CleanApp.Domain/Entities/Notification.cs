using CleanApp.Domain.Enums;

namespace CleanApp.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationSeverity Severity { get; set; } = NotificationSeverity.Info;
    public string? Category { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAtUtc { get; set; }

    public User User { get; set; } = null!;
}
