using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/part-requests")]
[Authorize(Roles = "Customer")]
public class PartRequestController : ControllerBase
{
    private readonly AppDbContext _db;

    public PartRequestController(AppDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

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

        // Notify Admins and Procurement Staff
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

public class CreatePartRequestDto
{
    public string PartName { get; set; } = string.Empty;
    public string? PartNumber { get; set; }
    public string? VehicleModel { get; set; }
    public string? Description { get; set; }
    public string? Urgency { get; set; }
}
       