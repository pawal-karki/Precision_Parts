namespace CleanApp.Domain.Entities;

public class Vehicle : BaseEntity
{
    public Guid CustomerId { get; set; }
    public string? Nickname { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Vin { get; set; }
    public string? PlateNumber { get; set; }
    public int? MileageKm { get; set; }
    public int? HealthScore { get; set; }
    public DateOnly? LastServiceDate { get; set; }

    public User Customer { get; set; } = null!;
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<AiPrediction> AiPredictions { get; set; } = new List<AiPrediction>();
}
