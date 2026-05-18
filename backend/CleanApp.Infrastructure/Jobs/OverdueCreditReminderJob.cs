using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using CleanApp.Application.Email;

namespace CleanApp.Infrastructure.Jobs;

/// <summary>
/// Finds customers with unpaid/overdue invoices whose DueDate has passed
/// and sends email reminders + in-app notifications. Scheduled daily via Hangfire.
/// The Hangfire daily schedule (Cron.Daily) is the only send throttle needed —
/// do NOT add an additional in-code throttle, it blocks the email silently.
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
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;

        // Find every invoice that is Unpaid, Partial, or Overdue with a past DueDate.
        var overdueInvoices = await db.Invoices
            .Include(i => i.Customer)
            .Where(i =>
                i.Status != InvoiceStatus.Paid &&
                i.BalanceDue > 0 &&
                i.CustomerId != null &&
                i.DueDate.HasValue &&
                i.DueDate.Value < now)
            .ToListAsync();

        if (!overdueInvoices.Any())
        {
            _logger.LogInformation("OverdueCreditReminderJob: No overdue invoices found.");
            return;
        }

        // Filter out invoices where the Customer navigation is null (data integrity guard).
        var validInvoices = overdueInvoices.Where(i => i.Customer != null).ToList();

        // Group by customer — one email per customer, even if they have multiple invoices.
        var byCustomer = validInvoices
            .GroupBy(i => i.CustomerId!.Value)
            .ToList();

        _logger.LogInformation(
            "OverdueCreditReminderJob: Found {Count} overdue customer(s). Sending reminders...",
            byCustomer.Count);

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        if (admin is null)
        {
            _logger.LogWarning("OverdueCreditReminderJob: No admin user found — skipping.");
            return;
        }

        // Dedup in-app notifications only (don't block email sends).
        var existingAdminAlertNames = await db.Notifications
            .Where(n => n.UserId == admin.Id && n.Category == "billing" && !n.IsRead)
            .Select(n => n.Message)
            .ToListAsync();

        var customerIds = byCustomer.Select(g => g.Key).ToList();
        var customersWithUnreadNotification = (await db.Notifications
            .Where(n => customerIds.Contains(n.UserId) && n.Category == "billing" && !n.IsRead)
            .Select(n => n.UserId)
            .ToListAsync())
            .ToHashSet();

        var emailsSent = 0;
        var emailsFailed = 0;
        var notificationsAdded = 0;

        foreach (var group in byCustomer)
        {
            var customer = group.First().Customer!;
            var totalOverdue = group.Sum(i => i.BalanceDue);
            var oldestDueDate = group.Min(i => i.DueDate!.Value);
            var daysOverdue = (int)(now - oldestDueDate).TotalDays;

            var alertMsg = $"{customer.FullName} account balance overdue by {daysOverdue} days. Outstanding: Rs. {totalOverdue:N2}";

            // ── Admin in-app notification (deduplicated by unread message content) ─────
            if (!existingAdminAlertNames.Any(e => e.Contains(customer.FullName)))
            {
                db.Notifications.Add(new Notification
                {
                    UserId = admin.Id,
                    Title = "Credit Overdue Reminder",
                    Message = alertMsg,
                    Severity = NotificationSeverity.Warning,
                    Category = "billing",
                    IsRead = false
                });
                notificationsAdded++;
            }

            // ── Customer in-app notification (deduplicated by unread billing notification) ─
            if (!customersWithUnreadNotification.Contains(customer.Id))
            {
                db.Notifications.Add(new Notification
                {
                    UserId = customer.Id,
                    Title = "Payment Reminder",
                    Message = $"Your account has an outstanding balance of Rs. {totalOverdue:N2} overdue by {daysOverdue} days. Please settle at your earliest convenience.",
                    Severity = NotificationSeverity.Warning,
                    Category = "billing",
                    IsRead = false
                });
                notificationsAdded++;
            }

            // ── Email reminder — always send; daily Hangfire schedule is the throttle ───
            _logger.LogInformation(
                "OverdueCreditReminderJob: Attempting email to {Email} for Rs. {Amount:N2} overdue...",
                customer.Email, totalOverdue);

            try
            {
                await emailService.SendOverdueCreditReminderAsync(
                    customer.Email, customer.FullName, totalOverdue, daysOverdue);

                emailsSent++;
                _logger.LogInformation(
                    "OverdueCreditReminderJob: ✓ Email sent to {Email}.",
                    customer.Email);
            }
            catch (Exception ex)
            {
                emailsFailed++;
                _logger.LogError(ex,
                    "OverdueCreditReminderJob: ✗ Failed to send email to {Email}. " +
                    "Check SMTP credentials in appsettings.json (Smtp:Host/Port/User/Pass).",
                    customer.Email);
            }
        }

        await db.SaveChangesAsync();

        _logger.LogInformation(
            "OverdueCreditReminderJob: Done. Emails sent: {Sent}, failed: {Failed}, notifications added: {Notifs}.",
            emailsSent, emailsFailed, notificationsAdded);
    }
}