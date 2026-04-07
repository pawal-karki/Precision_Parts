using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/reviews")]
[Authorize(Roles = "Customer")]
public class CustomerReviewsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CustomerReviewsController(AppDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpPost]
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

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = GetUserId();
        var reviews = await _db.Reviews
            .Where(r => r.CustomerId == userId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new
            {
                r.Id,
                r.Rating,
                r.Comment,
                r.CreatedAtUtc,
                appointmentId = r.AppointmentId
            })
            .ToListAsync(ct);

        return Ok(reviews);
    }
}

public class CreateReviewDto
{
    public Guid? AppointmentId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
           