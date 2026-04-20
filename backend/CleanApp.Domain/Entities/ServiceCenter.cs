namespace CleanApp.Domain.Entities;

public class ServiceCenter : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? AddressLine { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
