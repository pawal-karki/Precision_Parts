using CleanApp.Domain.Entities;

namespace CleanApp.Domain.Repositories;

public interface INotificationRepository
{
    Task<IReadOnlyList<Notification>> ListByUserIdNewestFirstAsync(Guid userId, CancellationToken cancellationToken = default);
}
    