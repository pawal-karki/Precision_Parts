using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for managing the customer's vehicle garage,
/// including adding, updating, listing, and removing registered vehicles.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/vehicles")]
[Authorize(Roles = "Customer")]
public class CustomerVehiclesController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerVehiclesController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for direct vehicle data access.</param>
    public CustomerVehiclesController(AppDbContext db) => _db = db;

    /// <summary>
    /// Extracts the authenticated customer's GUID from their JWT claims.
    /// Throws a <see cref="FormatException"/> if the claim is absent or cannot be parsed.
    /// </summary>
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    /// <summary>
    /// Retrieves all vehicles registered in the authenticated customer's garage,
    /// including nickname, mileage, health score, image URL, and last service date.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of the customer's vehicles.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = GetUserId();
        var vehicles = await _db.Vehicles
            .Where(v => v.CustomerId == userId)
            .Select(v => new {
                v.Id, v.Nickname, v.MileageKm, v.HealthScore, v.ImageUrl,
                lastServiceDate = v.LastServiceDate.ToString()
            })
            .ToListAsync(ct);
        return Ok(vehicles);
    }

    /// <summary>
    /// Adds a new vehicle to the authenticated customer's garage.
    /// The vehicle is initialised with a health score of 100 and the current date
    /// as the last service date.
    /// </summary>
    /// <param name="dto">The vehicle data including nickname, mileage, and optional image URL.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the newly created vehicle's key properties.</returns>
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] VehicleDto dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var vehicle = new Vehicle
        {
            CustomerId = userId,
            Nickname = dto.Nickname,
            MileageKm = dto.MileageKm ?? 0,
            ImageUrl = dto.ImageUrl,
            HealthScore = 100,
            LastServiceDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync(ct);
        return Ok(new { vehicle.Id, vehicle.Nickname, vehicle.MileageKm, vehicle.HealthScore, vehicle.ImageUrl });
    }

    /// <summary>
    /// Updates the details of a specific vehicle in the authenticated customer's garage.
    /// Only the vehicle owner may perform this operation; ownership is enforced via the customer ID.
    /// </summary>
    /// <param name="id">The unique identifier of the vehicle to update.</param>
    /// <param name="dto">The updated vehicle data including nickname, mileage, and image URL.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the updated vehicle's key properties on success;
    /// 404 Not Found if the vehicle does not exist or does not belong to the current customer.
    /// </returns>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] VehicleDto dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var vehicle = await _db.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.CustomerId == userId, ct);
        if (vehicle == null) return NotFound();

        vehicle.Nickname = dto.Nickname;
        vehicle.MileageKm = dto.MileageKm ?? vehicle.MileageKm;
        vehicle.ImageUrl = dto.ImageUrl ?? vehicle.ImageUrl;

        await _db.SaveChangesAsync(ct);
        return Ok(new { vehicle.Id, vehicle.Nickname, vehicle.MileageKm, vehicle.HealthScore, vehicle.ImageUrl });
    }

    /// <summary>
    /// Removes a specific vehicle from the authenticated customer's garage.
    /// Only the vehicle owner may perform this operation; ownership is enforced via the customer ID.
    /// </summary>
    /// <param name="id">The unique identifier of the vehicle to remove.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the vehicle does not exist or does not belong to the current customer.
    /// </returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var vehicle = await _db.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.CustomerId == userId, ct);
        if (vehicle == null) return NotFound();

        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}

/// <summary>
/// Represents the request payload for creating or updating a vehicle in the customer's garage.
/// </summary>
public class VehicleDto
{
    /// <summary>Gets or sets the vehicle's display nickname (e.g., "My Red Civic").</summary>
    public string Nickname { get; set; } = string.Empty;

    /// <summary>Gets or sets the vehicle's current odometer reading in kilometres.</summary>
    public int? MileageKm { get; set; }

    /// <summary>Gets or sets the relative URL of the vehicle's image, if provided.</summary>
    public string? ImageUrl { get; set; }
}