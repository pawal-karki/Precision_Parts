using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for submitting and retrieving service reviews.
/// Reviews can optionally be linked to a specific appointment.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/reviews")]
public class CustomerReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerReviewsController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for direct review data access.</param>
    public CustomerReviewsController(AppDbContext db) => _db = db;

    /// <summary>
    /// Extracts the authenticated customer's GUID from their JWT claims.
    /// Throws a <see cref="FormatException"/> if the claim is absent or cannot be parsed.
    /// </summary>
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    /// <summary>
    /// Submits a new service review from the authenticated customer.
    /// Reviews can be associated with a specific appointment by providing an
    /// <c>AppointmentId</c> in the request payload.
    /// </summary>
    /// <param name="dto">The review payload containing rating (1–5), optional comment, and optional appointment ID.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the newly created review's ID, rating, comment, and timestamp.</returns>
    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Create([FromBody] CreateReviewDto dto, CancellationToken ct)
    {
        var review = new Review
        {
            CustomerId = GetUserId(),
            AppointmentId = dto.AppointmentId,
            Rating = dto.Rating,
            Comment = dto.Comment
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(ct);
        return Ok(new { review.Id, review.Rating, review.Comment, createdAt = review.CreatedAtUtc });
    }

    /// <summary>
    /// Retrieves all reviews submitted by the currently authenticated customer,
    /// ordered by submission date descending.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the customer's review history.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var reviews = await _db.Reviews
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAtUtc,
                appointmentId = r.AppointmentId,
                customerName = r.Customer != null ? r.Customer.FullName : "Anonymous"
            })
            .ToListAsync(ct);

        return Ok(reviews);
    }
}

/// <summary>
/// Represents the request payload for submitting a service review.
/// </summary>
public class CreateReviewDto
{
    /// <summary>
    /// Gets or sets the optional appointment ID to associate this review with a specific service visit.
    /// </summary>
    public Guid? AppointmentId { get; set; }

    /// <summary>
    /// Gets or sets the star rating for the service (expected range: 1–5).
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Gets or sets the optional free-text comment accompanying the rating.
    /// </summary>
    public string? Comment { get; set; }
}