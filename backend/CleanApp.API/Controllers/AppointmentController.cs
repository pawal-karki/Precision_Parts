using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Application.Appointments;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/appointments")]
[Authorize(Roles = "Customer")]
public class AppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentController(AppDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto, CancellationToken ct)
    {
        var userId = GetUserId();

        var appointment = new Appointment
        {
            CustomerId = userId,
            VehicleId = dto.VehicleId,
            ScheduledAtUtc = dto.ScheduledAt.ToUniversalTime(),
            Status = AppointmentStatus.Booked,
            PickupRequired = dto.PickupRequired,
            Notes = dto.Notes
        };

        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);

        // Add services if provided
        if (dto.ServiceTypeIds.Any())
        {
            foreach (var stId in dto.ServiceTypeIds)
            {
                _db.AppointmentServices.Add(new AppointmentService
                {
                    AppointmentId = appointment.Id,
                    ServiceTypeId = stId
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        var response = new AppointmentResponseDto
        {
            Id = appointment.Id,
            ReferenceNumber = $"SRV-{appointment.Id.ToString("N")[..6].ToUpper()}",
            ScheduledAtUtc = appointment.ScheduledAtUtc,
            Status = appointment.Status.ToString(),
            PickupRequired = appointment.PickupRequired,
            Notes = appointment.Notes
        };

        return Ok(response);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = GetUserId();
        var appointments = await _db.Appointments
            .Where(a => a.CustomerId == userId)
            .Include(a => a.Vehicle)
            .Include(a => a.Services).ThenInclude(s => s.ServiceType)
            .OrderByDescending(a => a.ScheduledAtUtc)
            .Select(a => new AppointmentResponseDto
            {
                Id = a.Id,
                ReferenceNumber = $"SRV-{a.Id.ToString().Substring(0, 6).ToUpper()}",
                ScheduledAtUtc = a.ScheduledAtUtc,
                Status = a.Status.ToString(),
                PickupRequired = a.PickupRequired,
                Notes = a.Notes,
                VehicleName = a.Vehicle != null ? a.Vehicle.Nickname : null,
                Services = a.Services.Select(s => s.ServiceType!.Name).ToList()
            })
            .ToListAsync(ct);

        return Ok(appointments);
    }
}
     