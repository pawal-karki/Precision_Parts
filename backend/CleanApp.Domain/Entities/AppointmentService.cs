namespace CleanApp.Domain.Entities;

public class AppointmentService
{
    public Guid AppointmentId { get; set; }
    public Guid ServiceTypeId { get; set; }
    public decimal PriceAtBooking { get; set; }

    public Appointment Appointment { get; set; } = null!;
    public ServiceType ServiceType { get; set; } = null!;
}
         