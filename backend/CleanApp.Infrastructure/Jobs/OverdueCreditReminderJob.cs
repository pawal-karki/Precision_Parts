using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CleanApp.Infrastructure.Jobs;

/// <summary>
/// Finds customers with outstanding credit older than 30 days and creates
/// reminder notifications. Scheduled daily via Hangfire.
/// </summary>
public class OverdueCreditReminderJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OverdueCreditReminderJob> _logger;

    public OverdueCreditReminderJob(IServiceScopeFactory scopeFactory, ILogger<OverdueCreditReminderJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoffDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));

        var overdueProfiles = await db.CustomerProfiles
            .Include(cp => cp.User)
            .Where(cp => cp.OutstandingCredit > 0 && cp.LastOrderDate.HasValue && cp.LastOrderDate.Value < cutoffDate)
            .ToListAsync();

        if (!overdueProfiles.Any())
        {
            _logger.LogInformation("OverdueCreditReminderJob: No overdue credits found.");
            return;
        }

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        if (admin is null) return;

        // Check existing unread credit alerts to avoid duplicates
        var existingAlerts = await db.Notifications
            .Where(n => n.UserId == admin.Id && n.Category == "billing" && !n.IsRead)
            .Select(n => n.Message)
            .ToListAsync();

        var newAlerts = 0;
        foreach (var profile in overdueProfiles)
        {
            var daysOverdue = (DateTime.UtcNow - profile.LastOrderDate!.Value.ToDateTime(TimeOnly.MinValue)).Days;
            var alertMsg = $"{profile.User.FullName} account balance overdue by {daysOverdue} days. Outstanding: Rs. {profile.OutstandingCredit:N2}";

            if (existingAlerts.Any(e => e.Contains(profile.User.FullName)))
                continue;

            // Notification for Admin
            db.Notifications.Add(new Notification
            {
                UserId = admin.Id,
                Title = "Credit Overdue Reminder",
                Message = alertMsg,
                Severity = NotificationSeverity.Warning,
                Category = "billing",
                IsRead = false
            });

            // Notification for the customer
            db.Notifications.Add(new Notification
            {
                UserId = profile.UserId,
                Title = "Payment Reminder",
                Message = $"Your account has an outstanding balance of Rs. {profile.OutstandingCredit:N2} overdue by {daysOverdue} days. Please settle at your earliest convenience.",
                Severity = NotificationSeverity.Warning,
                Category = "billing",
                IsRead = false
            });

            newAlerts++;
        }

        if (newAlerts > 0)
        {
            await db.SaveChangesAsync();
            _logger.LogInformation("OverdueCreditReminderJob: Created {Count} overdue credit reminders.", newAlerts);
        }
    }
}
   