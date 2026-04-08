namespace CleanApp.Domain.Entities;

public class PartRequest : BaseEntity
{
    public Guid CustomerId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public string? PartNumber { get; set; }
    public string? VehicleModel { get; set; }
    public string? Description { get; set; }
    public string? Urgency { get; set; } // Normal, Urgent, Critical
    public string Status { get; set; } = "Pending"; // Pending, Sourcing, Available, Cancelled

    public User Customer { get; set; } = null!;
}
        