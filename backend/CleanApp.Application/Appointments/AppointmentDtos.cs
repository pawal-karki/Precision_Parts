using System.ComponentModel.DataAnnotations;

namespace CleanApp.Application.Appointments;

public class CreateAppointmentDto
{
    public Guid? VehicleId { get; set; }
    [Required]
    public DateTime ScheduledAt { get; set; }
    public bool PickupRequired { get; set; }
    public string? Notes { get; set; }
    public List<Guid> ServiceTypeIds { get; set; } = new();
}

public class AppointmentResponseDto
{
    public Guid Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public DateTime ScheduledAtUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool PickupRequired { get; set; }
    public string? Notes { get; set; }
    public string? VehicleName { get; set; }
    public List<string> Services { get; set; } = new();
}

public class AdminAppointmentResponseDto : AppointmentResponseDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
}

public class AdminCreateAppointmentDto : CreateAppointmentDto
{
    [Required]
    public Guid CustomerId { get; set; }
}

public class SlotOccupancyDto
{
    public DateTime TimeSlot { get; set; }
    public int Occupancy { get; set; }
    public int Capacity { get; set; } = 7;
    public bool IsFull => Occupancy >= Capacity;
}

public class UpdateAppointmentStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}