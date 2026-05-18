using System.Security.Claims;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides endpoints for managing in-app notifications for the authenticated user.
/// Supports retrieving recent notifications, marking individual notifications as read,
/// and bulk-marking all unread notifications as read.
/// Accessible by any authenticated role (Admin, Staff, Customer).
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="NotificationsController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for direct notification data access.</param>
    public NotificationsController(AppDbContext db) => _db = db;

    /// <summary>
    /// Extracts the authenticated user's GUID from their JWT claims.
    /// Throws a <see cref="FormatException"/> if the claim is absent or unparseable.
    /// </summary>
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    /// <summary>
    /// Retrieves the 50 most recent notifications for the currently authenticated user,
    /// ordered by creation date descending. Includes title, message, read status,
    /// severity level, and category for each notification.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of recent notifications.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = GetUserId();
        var items = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(50)
            .Select(n => new {
                n.Id, n.Title, n.Message, n.IsRead,
                severity = n.Severity.ToString().ToLower(),
                n.Category,
                n.CreatedAtUtc
            })
            .ToListAsync(ct);
        return Ok(items);
    }

    /// <summary>
    /// Marks a specific notification as read for the currently authenticated user.
    /// Only notifications belonging to the requesting user can be updated.
    /// </summary>
    /// <param name="id">The unique identifier of the notification to mark as read.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the notification does not exist or does not belong to the current user.
    /// </returns>
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (n is null) return NotFound();
        n.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// Marks all unread notifications as read for the currently authenticated user in a single operation.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 204 No Content response confirming all notifications have been marked as read.</returns>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = GetUserId();
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);
        unread.ForEach(n => n.IsRead = true);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
