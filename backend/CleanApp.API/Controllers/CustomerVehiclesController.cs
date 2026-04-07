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
                v.Id, v.Nickname, v.MileageKm, v.HealthScore,
                lastServiceDate = v.LastServiceDate.ToString()
            })
            .ToListAsync(ct);
        return Ok(vehicles);
    }

    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddVehicleDto dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var vehicle = new Vehicle
        {
            CustomerId = userId,
            Nickname = dto.Nickname,
            MileageKm = dto.MileageKm ?? 0,
            HealthScore = 100,
            LastServiceDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync(ct);
        return Ok(new { vehicle.Id, vehicle.Nickname, vehicle.MileageKm, vehicle.HealthScore });
    }
}

public class AddVehicleDto
{
    public string Nickname { get; set; } = string.Empty;
    public int? MileageKm { get; set; }
}
                                         