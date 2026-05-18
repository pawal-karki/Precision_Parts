using System.Security.Claims;
using CleanApp.Application.Ai;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides AI-powered part and maintenance recommendation endpoints for authenticated customers.
/// Leverages the Gemini large language model, contextualised with the customer's vehicle data
/// and recent purchase/service history to generate personalised recommendations.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/ai")]
[Authorize(Roles = "Customer")]
public class AiRecommendationController : ControllerBase
{
    private readonly IGeminiService _gemini;
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="AiRecommendationController"/>
    /// with the required Gemini service and database context.
    /// </summary>
    /// <param name="gemini">The service responsible for communicating with the Gemini AI API.</param>
    /// <param name="db">The application database context for retrieving vehicle and order data.</param>
    public AiRecommendationController(IGeminiService gemini, AppDbContext db)
    {
        _gemini = gemini;
        _db = db;
    }

    /// <summary>
    /// Extracts the authenticated customer's GUID from their JWT claims.
    /// Throws a <see cref="FormatException"/> if the claim is absent or cannot be parsed.
    /// </summary>
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    /// <summary>
    /// Generates a personalised AI recommendation for the authenticated customer based on their
    /// vehicle health metrics, odometer readings, and the last 5 service/purchase records.
    /// An optional free-text prompt can be included in the request to ask a specific question.
    /// The response is returned as raw JSON from the Gemini model.
    /// </summary>
    /// <param name="request">
    /// The recommendation request payload, optionally specifying a vehicle ID to scope
    /// the recommendation and a free-text prompt for targeted questions.
    /// </param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// A 200 OK response containing the raw JSON recommendation from the Gemini AI model.
    /// </returns>
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

        // Get recent order history (last 5 invoices)
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

/// <summary>
/// Represents the request payload for generating an AI maintenance recommendation.
/// </summary>
public class AiRecommendRequest
{
    /// <summary>
    /// Gets or sets the optional vehicle ID to scope the recommendation to a specific vehicle.
    /// If omitted, the recommendation considers all vehicles in the customer's garage.
    /// </summary>
    public Guid? VehicleId { get; set; }

    /// <summary>
    /// Gets or sets an optional free-text prompt for asking a targeted maintenance question
    /// (e.g., "What parts should I replace before winter?").
    /// </summary>
    public string? Prompt { get; set; }
}
