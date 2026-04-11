using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Notifications;

public class NotificationsService : INotificationsService
{
    private readonly IUserRepository _users;
    private readonly INotificationRepository _notifications;

    public NotificationsService(IUserRepository users, INotificationRepository notifications)
    {
        _users = users;
        _notifications = notifications;
    }

    public async Task<IReadOnlyList<NotificationRowDto>> ListForFirstAdminAsync(CancellationToken cancellationToken = default)
    {
        var admin = await _users.GetFirstAdminAsync(cancellationToken);
        if (admin == null)
            return Array.Empty<NotificationRowDto>();

        var notes = await _notifications.ListByUserIdNewestFirstAsync(admin.Id, cancellationToken);
        return notes.Select((n, idx) => new NotificationRowDto(
            idx + 1,
            n.Severity switch
            {
                NotificationSeverity.Error => "error",
                NotificationSeverity.Warning => "warning",
                NotificationSeverity.Success => "success",
                _ => "info"
            },
            n.Title,
            n.Message,
            RelativeTime(n.CreatedAtUtc),
            n.IsRead)).ToList();
    }

    private static string RelativeTime(DateTime utc)
    {
        var diff = DateTime.UtcNow - utc;
        if (diff.TotalMinutes < 1) return "just now";
        if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes} min ago";
        if (diff.TotalHours < 24) return $"{(int)diff.TotalHours} hour{(diff.TotalHours >= 2 ? "s" : "")} ago";
        return $"{(int)diff.TotalDays} day{(diff.TotalDays >= 2 ? "s" : "")} ago";
    }
}
