using CleanApp.Application.Appointments;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides staff-facing endpoints for viewing and managing all service appointments.
/// Mirrors the admin appointment interface but restricts access to the Staff role only.
/// Supports listing, slot occupancy analysis, appointment creation, and status updates.
/// </summary>
[ApiController]
[Route("api/staff/appointments")]
[Authorize(Roles = "Staff")]
public class StaffAppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="StaffAppointmentController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for appointment data access.</param>
    public StaffAppointmentController(AppDbContext db) => _db = db;

    /// <summary>
    /// Retrieves all service appointments with full details including customer information,
    /// linked vehicle, scheduled time, status, and associated service types.
    /// Results are ordered by scheduled date descending.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of all appointments.</returns>
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

    /// <summary>
    /// Retrieves the slot occupancy breakdown for a specific date, showing how many
    /// appointments are booked per time slot versus the maximum capacity of 7 per slot.
    /// </summary>
    /// <param name="date">The date for which to retrieve slot occupancy data.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of time slots with occupancy counts.</returns>
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

    /// <summary>
    /// Creates a new service appointment on behalf of a customer.
    /// Validates that any linked vehicle belongs to the specified customer before persisting.
    /// Updates the vehicle's last service date upon successful creation.
    /// </summary>
    /// <param name="dto">The appointment creation payload including customer ID, vehicle, schedule time, and services.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the new appointment's ID and a confirmation message on success;
    /// 400 Bad Request if the vehicle does not belong to the specified customer.
    /// </returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminCreateAppointmentDto dto, CancellationToken ct)
    {
        var scheduledAt = dto.ScheduledAt.ToUniversalTime();

        Vehicle? linkedVehicle = null;
        if (dto.VehicleId is { } vehicleId && vehicleId != Guid.Empty)
        {
            linkedVehicle = await _db.Vehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == dto.CustomerId, ct);
            if (linkedVehicle is null)
                return BadRequest(new { message = "Vehicle does not belong to the selected customer." });
        }

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

        if (linkedVehicle is not null)
        {
            linkedVehicle.LastServiceDate = DateOnly.FromDateTime(scheduledAt);
            await _db.SaveChangesAsync(ct);
        }

        return Ok(new { id = appointment.Id, message = "Appointment created successfully." });
    }

    /// <summary>
    /// Updates the processing status of an existing appointment
    /// (e.g., Booked → InProgress → Completed → Cancelled).
    /// Status values are matched case-insensitively against the <see cref="AppointmentStatus"/> enum.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to update.</param>
    /// <param name="dto">The status update payload containing the new status string.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a confirmation message on success;
    /// 404 Not Found if the appointment does not exist;
    /// 400 Bad Request if the provided status string is invalid.
    /// </returns>
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
