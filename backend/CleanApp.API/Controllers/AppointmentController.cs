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
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentController(AppDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto, CancellationToken ct)
    {
        var userId = GetUserId();
        var scheduledAt = dto.ScheduledAt.ToUniversalTime();

        // 1. Time slot capacity limit (Max 7 users per time slot)
        var slotCount = await _db.Appointments
            .CountAsync(a => a.ScheduledAtUtc == scheduledAt && a.Status != AppointmentStatus.Cancelled, ct);

        if (slotCount >= 7)
        {
            return BadRequest(new { message = "This time slot is fully booked. Please select another time." });
        }

        // 2. One appointment per day per user
        var startOfDay = scheduledAt.Date;
        var endOfDay = startOfDay.AddDays(1);

        var userDailyBookings = await _db.Appointments
            .CountAsync(a => a.CustomerId == userId 
                          && a.ScheduledAtUtc >= startOfDay 
                          && a.ScheduledAtUtc < endOfDay 
                          && a.Status != AppointmentStatus.Cancelled, ct);

        if (userDailyBookings >= 1)
        {
            return BadRequest(new { message = "You can only book one appointment in a day. To change your appointment, please cancel your booked appointment first." });
        }

        Vehicle? linkedVehicle = null;
        if (dto.VehicleId is { } vehicleId && vehicleId != Guid.Empty)
        {
            linkedVehicle = await _db.Vehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == userId, ct);
            if (linkedVehicle is null)
                return BadRequest(new { message = "Selected vehicle was not found in your garage." });
        }

        var appointment = new Appointment
        {
            CustomerId = userId,
            VehicleId = dto.VehicleId,
            ScheduledAtUtc = scheduledAt,
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

        // Tie scheduled service date to the vehicle's "last service" record in the garage
        if (linkedVehicle is not null)
        {
            linkedVehicle.LastServiceDate = DateOnly.FromDateTime(scheduledAt);
            await _db.SaveChangesAsync(ct);
        }

        var response = new AppointmentResponseDto
        {
            Id = appointment.Id,
            ReferenceNumber = $"SRV-{appointment.Id.ToString("N")[..6].ToUpper()}",
            ScheduledAtUtc = appointment.ScheduledAtUtc,
            Status = appointment.Status.ToString(),
            PickupRequired = appointment.PickupRequired,
            Notes = appointment.Notes,
            VehicleName = linkedVehicle?.Nickname
        };

        return Ok(response);
    }

    [HttpGet]
    [Authorize(Roles = "Customer")]
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

    [HttpGet("services")]
    [Authorize(Roles = "Customer,Admin,Staff")]
    public async Task<IActionResult> GetServices(CancellationToken ct)
    {
        var services = await _db.ServiceTypes
            .Select(st => new
            {
                st.Id,
                st.Name,
                st.Description,
                Price = st.BasePrice,
                EstMinutes = st.EstimatedMinutes
            })
            .ToListAsync(ct);
        return Ok(services);
    }

    [HttpPatch("{id}/cancel")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var appointment = await _db.Appointments
            .FirstOrDefaultAsync(a => a.Id == id && a.CustomerId == userId, ct);

        if (appointment == null)
            return NotFound(new { message = "Appointment not found." });

        if (appointment.Status == AppointmentStatus.Cancelled)
            return BadRequest(new { message = "Appointment is already cancelled." });

        appointment.Status = AppointmentStatus.Cancelled;
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Appointment successfully cancelled." });
    }
}
     