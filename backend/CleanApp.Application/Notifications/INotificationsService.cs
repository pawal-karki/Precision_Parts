namespace CleanApp.Application.Notifications;

public record NotificationRowDto(int Id, string Type, string Title, string Message, string Time, bool Read);

public interface INotificationsService
{
    Task<IReadOnlyList<NotificationRowDto>> ListForFirstAdminAsync(CancellationToken cancellationToken = default);
}
