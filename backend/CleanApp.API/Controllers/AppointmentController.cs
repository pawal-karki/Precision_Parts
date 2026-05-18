using System.Security.Claims;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Application.Appointments;
using CleanApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for booking, listing, and cancelling service appointments,
/// as well as browsing available service types. Enforces business rules such as:
/// a maximum of 7 bookings per time slot, and one appointment per customer per day.
/// Restricted to authenticated users; write operations require the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/appointments")]
[Authorize]
public class AppointmentController : ControllerBase
{
    private readonly AppDbContext _db;

    /// <summary>
    /// Initializes a new instance of <see cref="AppointmentController"/>
    /// with the required database context.
    /// </summary>
    /// <param name="db">The application database context for appointment data access.</param>
    public AppointmentController(AppDbContext db) => _db = db;

    /// <summary>
    /// Extracts the authenticated customer's GUID from their JWT claims.
    /// Throws a <see cref="FormatException"/> if the claim is absent or cannot be parsed.
    /// </summary>
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    /// <summary>
    /// Books a new service appointment for the authenticated customer.
    /// Enforces the following business rules before persisting:
    /// <list type="bullet">
    ///   <item>Maximum 7 non-cancelled bookings per time slot.</item>
    ///   <item>One active appointment per customer per calendar day.</item>
    ///   <item>Vehicle, if specified, must belong to the requesting customer.</item>
    /// </list>
    /// On success, optionally links the appointment to a vehicle and updates
    /// the vehicle's last service date.
    /// </summary>
    /// <param name="dto">The appointment booking payload including date/time, vehicle, pickup flag, and service types.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the appointment details on success;
    /// 400 Bad Request if a business rule is violated (slot full, duplicate booking, or invalid vehicle).
    /// </returns>
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

    /// <summary>
    /// Retrieves all service appointments associated with the currently authenticated customer,
    /// ordered by scheduled date descending, with vehicle and service type details included.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the customer's appointment history.</returns>
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

    /// <summary>
    /// Retrieves the catalogue of all available service types offered by the workshop,
    /// including name, description, base price, and estimated duration in minutes.
    /// Accessible by Customer, Admin, and Staff roles.
    /// </summary>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of available service types.</returns>
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

    /// <summary>
    /// Cancels an existing appointment belonging to the currently authenticated customer.
    /// Only the appointment owner may cancel it, and only if it has not already been cancelled.
    /// </summary>
    /// <param name="id">The unique identifier of the appointment to cancel.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a confirmation message on success;
    /// 404 Not Found if the appointment does not exist or does not belong to the current user;
    /// 400 Bad Request if the appointment has already been cancelled.
    /// </returns>
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