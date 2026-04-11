using System.Security.Claims;
using CleanApp.Application.Ai;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/ai")]
[Authorize(Roles = "Customer")]
public class AiRecommendationController : ControllerBase
{
    private readonly IGeminiService _gemini;
    private readonly AppDbContext _db;

    public AiRecommendationController(IGeminiService gemini, AppDbContext db)
    {
        _gemini = gemini;
        _db = db;
    }

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpPost("recommend")]
    public async Task<IActionResult> GetRecommendation([FromBody] AiRecommendRequest request, CancellationToken ct)
    {
        var userId = GetUserId();

        // Gather vehicle info
        var vehicles = await _db.Vehicles
            .Where(v => v.CustomerId == userId)
            .Select(v => new { v.Nickname, v.MileageKm, v.HealthScore, v.LastServiceDate })
            .ToListAsync(ct);

        var vehicleInfo = request.VehicleId.HasValue
            ? (await _db.Vehicles
                .Where(v => v.Id == request.VehicleId.Value && v.CustomerId == userId)
                .Select(v => $"{v.Nickname}, Mileage: {v.MileageKm}km, Health: {v.HealthScore}%, Last Service: {v.LastServiceDate}")
                .FirstOrDefaultAsync(ct)) ?? "No vehicle data"
            : string.Join("; ", vehicles.Select(v => $"{v.Nickname} ({v.MileageKm}km, Health:{v.HealthScore}%)"));

        // Get recent order history
        var recentOrders = await _db.Invoices
            .Where(i => i.CustomerId == userId)
            .OrderByDescending(i => i.IssueDate)
            .Take(5)
            .Include(i => i.Items)
            .Select(i => $"{i.IssueDate}: {string.Join(", ", i.Items.Select(it => it.Description))}")
            .ToListAsync(ct);

        var serviceHistory = recentOrders.Any()
            ? string.Join("\n", recentOrders)
            : "No recent service history";

        if (!string.IsNullOrWhiteSpace(request.Prompt))
        {
            vehicleInfo += $"\n\nUser question: {request.Prompt}";
        }

        var result = await _gemini.GetRecommendationAsync(vehicleInfo, serviceHistory, ct);

        return Content(result, "application/json");
    }
}

public class AiRecommendRequest
{
    public Guid? VehicleId { get; set; }
    public string? Prompt { get; set; }
}
