using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/vehicles")]
[Authorize(Roles = "Customer")]
public class CustomerVehiclesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomerVehiclesController(AppDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

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

public class VehicleDto
{
    public string Nickname { get; set; } = string.Empty;
    public int? MileageKm { get; set; }
    public string? ImageUrl { get; set; }
}
                                         