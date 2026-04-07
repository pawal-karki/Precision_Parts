using CleanApp.Domain.Enums;

namespace CleanApp.Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Guid? VehicleId { get; set; }
    public Guid? ServiceCenterId { get; set; }
    public DateTime ScheduledAtUtc { get; set; }
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;
    public bool PickupRequired { get; set; }
    public string? Notes { get; set; }

    public User Customer { get; set; } = null!;
    public Vehicle? Vehicle { get; set; }
    public ServiceCenter? ServiceCenter { get; set; }
    public ICollection<AppointmentService> Services { get; set; } = new List<AppointmentService>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
      