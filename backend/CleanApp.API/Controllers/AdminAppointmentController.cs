using CleanApp.Application.Appointments;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative endpoints for managing all service appointments across the system.
/// Supports full CRUD operations, slot occupancy analysis, and appointment status management.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/appointments")]
[Authorize(Roles = "Admin")]
public class AdminAppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminAppointmentController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for appointment data access.</param>
    public AdminAppointmentController(AppDbContext db) => _db = db;

    /// <summary>
    /// Retrieves all service appointments in the system with full details including
    /// customer information, linked vehicle, scheduled time, status, and associated services.
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
    /// Used for scheduling and resource planning on the admin calendar view.
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
    /// Creates a new service appointment on behalf of a customer, with optional
    /// vehicle linkage and service type assignments. Restricted to Admin users.
    /// </summary>
    /// <param name="dto">The appointment creation payload including customer ID, vehicle, schedule time, and services.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the new appointment's ID and a confirmation message.</returns>
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

    /// <summary>
    /// Updates the status of an existing appointment (e.g., Booked → InProgress → Completed → Cancelled).
    /// Status values are matched case-insensitively against the <see cref="AppointmentStatus"/> enum.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to update.</param>
    /// <param name="dto">The status update payload containing the new status string.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a confirmation message on success;
    /// 404 Not Found if the appointment does not exist;
    /// 400 Bad Request if the provided status string is not a valid <see cref="AppointmentStatus"/> value.
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

    /// <summary>
    /// Permanently removes an appointment from the system by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to delete.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a confirmation message on success;
    /// 404 Not Found if the appointment does not exist.
    /// </returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var appointment = await _db.Appointments.FindAsync(new object[] { id }, ct);
        if (appointment == null) return NotFound();

        _db.Appointments.Remove(appointment);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Appointment deleted successfully." });
    }
}
