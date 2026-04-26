using CleanApp.Application.Appointments;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/appointments")]
[Authorize(Roles = "Staff")]
public class StaffAppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    public StaffAppointmentController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var appointments = await _db.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Vehicle)
            .Include(a => a.Services).ThenInclude(s => s.ServiceType)
            .OrderByDescending(a => a.ScheduledAtUtc)
            .Select(a => new AdminAppointmentResponseDto
            {
                Id = a.Id,
                ReferenceNumber = $"SRV-{a.Id.ToString().Substring(0, 6).ToUpper()}",
                ScheduledAtUtc = a.ScheduledAtUtc,
                Status = a.Status.ToString(),
                PickupRequired = a.PickupRequired,
                Notes = a.Notes,
                VehicleName = a.Vehicle != null ? a.Vehicle.Nickname : "General Service",
                CustomerName = a.Customer.FullName,
                CustomerEmail = a.Customer.Email,
                CustomerPhone = a.Customer.Phone ?? "N/A",
                Services = a.Services.Select(s => s.ServiceType!.Name).ToList()
            })
            .ToListAsync(ct);

        return Ok(appointments);
    }

    [HttpGet("occupancy")]
    public async Task<IActionResult> GetOccupancy([FromQuery] DateTime date, CancellationToken ct)
    {
        var startOfDay = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var endOfDay = startOfDay.AddDays(1);

        var occupancy = await _db.Appointments
            .Where(a => a.ScheduledAtUtc >= startOfDay && a.ScheduledAtUtc < endOfDay && a.Status != AppointmentStatus.Cancelled)
            .GroupBy(a => a.ScheduledAtUtc)
            .Select(g => new SlotOccupancyDto
            {
                TimeSlot = g.Key,
                Occupancy = g.Count(),
                Capacity = 7
            })
            .ToListAsync(ct);

        return Ok(occupancy);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminCreateAppointmentDto dto, CancellationToken ct)
    {
        var scheduledAt = dto.ScheduledAt.ToUniversalTime();

        var appointment = new Appointment
        {
            CustomerId = dto.CustomerId,
            VehicleId = dto.VehicleId,
            ScheduledAtUtc = scheduledAt,
            Status = AppointmentStatus.Booked,
            PickupRequired = dto.PickupRequired,
            Notes = dto.Notes
        };

        _db.Appointments.Add(appointment);
        
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
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { id = appointment.Id, message = "Appointment created successfully." });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateAppointmentStatusDto dto, CancellationToken ct)
    {
        var appointment = await _db.Appointments.FindAsync(new object[] { id }, ct);
        if (appointment == null) return NotFound();

        if (Enum.TryParse<AppointmentStatus>(dto.Status, true, out var status))
        {
            appointment.Status = status;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = $"Status updated to {status}" });
        }

        return BadRequest(new { message = "Invalid status." });
    }
}
