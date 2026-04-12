using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CleanApp.Infrastructure.Jobs;

/// <summary>
/// Scans parts where StockQty is below ReorderLevel and creates admin notifications.
/// Scheduled to run every hour via Hangfire.
/// </summary>
public class LowStockAlertJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LowStockAlertJob> _logger;

    public LowStockAlertJob(IServiceScopeFactory scopeFactory, ILogger<LowStockAlertJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var lowStockParts = await db.Parts
            .Where(p => p.IsActive && p.StockQty < p.ReorderLevel)
            .ToListAsync();

        if (!lowStockParts.Any())
        {
            _logger.LogInformation("LowStockAlertJob: No low-stock parts found.");
            return;
        }

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        if (admin is null) return;

        // Check for existing unread low-stock notifications to avoid duplicates
        var existingAlerts = await db.Notifications
            .Where(n => n.UserId == admin.Id && n.Category == "inventory" && !n.IsRead)
            .Select(n => n.Message)
            .ToListAsync();

        var newAlerts = 0;
        foreach (var part in lowStockParts)
        {
            var alertMsg = $"{part.Name} (SKU: {part.Sku}) stock at {part.StockQty} units — below minimum threshold of {part.ReorderLevel}.";

            if (existingAlerts.Any(e => e.Contains(part.Sku)))
                continue;

            db.Notifications.Add(new Notification
            {
                UserId = admin.Id,
                Title = part.StockQty < 10 ? "Critical: Low Stock Alert" : "Low Stock Warning",
                Message = alertMsg,
                Severity = part.StockQty < 10 ? NotificationSeverity.Error : NotificationSeverity.Warning,
                Category = "inventory",
                IsRead = false
            });
            newAlerts++;
        }

        if (newAlerts > 0)
        {
            await db.SaveChangesAsync();
            _logger.LogInformation("LowStockAlertJob: Created {Count} new low-stock alerts.", newAlerts);
        }
    }
}
          