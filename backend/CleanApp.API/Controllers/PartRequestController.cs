using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for submitting requests for parts that are
/// not currently in stock. Upon submission, Admin users and Procurement Staff are
/// automatically notified via the in-app notification system.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/part-requests")]
[Authorize(Roles = "Customer")]
public class PartRequestController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="PartRequestController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for part request and notification operations.</param>
    public PartRequestController(AppDbContext db) => _db = db;

    /// <summary>
    /// Extracts the authenticated customer's GUID from their JWT claims.
    /// Throws a <see cref="FormatException"/> if the claim is absent or cannot be parsed.
    /// </summary>
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    /// <summary>
    /// Submits a new part request for a part not currently available in the inventory.
    /// After creation, Admin users and all Procurement Staff members receive an
    /// in-app notification alerting them to the new request.
    /// </summary>
    /// <param name="dto">
    /// The part request payload including part name, optional part number,
    /// vehicle model, description, and urgency level.
    /// </param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// A 200 OK response containing the new request's ID, part name, status, and creation timestamp.
    /// </returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartRequestDto dto, CancellationToken ct)
    {
        var request = new PartRequest
        {
            CustomerId = GetUserId(),
            PartName = dto.PartName,
            PartNumber = dto.PartNumber,
            VehicleModel = dto.VehicleModel,
            Description = dto.Description,
            Urgency = dto.Urgency ?? "Normal",
            Status = "Pending"
        };

        _db.Set<PartRequest>().Add(request);
        await _db.SaveChangesAsync(ct);

        // Notify Admins and Procurement Staff of the new part request
        var staffToNotify = await _db.Users
            .Where(u => u.Role == CleanApp.Domain.Enums.UserRole.Admin || u.Department == "Procurement")
            .ToListAsync(ct);

        foreach (var staff in staffToNotify)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = staff.Id,
                Title = "New Part Request",
                Message = $"A new part request for '{request.PartName}' was submitted by a customer. Priority: {request.Urgency}.",
                Severity = CleanApp.Domain.Enums.NotificationSeverity.Info,
                Category = "part_requests",
                IsRead = false
            });
        }
        await _db.SaveChangesAsync(ct);

        return Ok(new { request.Id, request.PartName, request.Status, createdAt = request.CreatedAtUtc });
    }

    /// <summary>
    /// Retrieves all part requests submitted by the currently authenticated customer,
    /// ordered by creation date descending.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the customer's part request history.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = GetUserId();
        var requests = await _db.Set<PartRequest>()
            .Where(r => r.CustomerId == userId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new
            {
                r.Id,
                r.PartName,
                r.PartNumber,
                r.VehicleModel,
                r.Description,
                r.Urgency,
                r.Status,
                r.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Ok(requests);
    }
}

/// <summary>
/// Represents the request payload for submitting a customer part request.
/// </summary>
public class CreatePartRequestDto
{
    /// <summary>Gets or sets the name of the requested part. Required.</summary>
    public string PartName { get; set; } = string.Empty;

    /// <summary>Gets or sets the manufacturer part number, if known.</summary>
    public string? PartNumber { get; set; }

    /// <summary>Gets or sets the vehicle model the part is intended for.</summary>
    public string? VehicleModel { get; set; }

    /// <summary>Gets or sets additional context or specifications for the part request.</summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the urgency level of the request (e.g., "Normal", "High", "Critical").
    /// Defaults to "Normal" if not provided.
    /// </summary>
    public string? Urgency { get; set; }
}