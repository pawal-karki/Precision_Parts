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
    public decimal TotalEstimate { get; set; }
}
      