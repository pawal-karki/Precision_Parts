namespace CleanApp.Domain.Entities;

public class AiPrediction : BaseEntity
{
    public Guid VehicleId { get; set; }
    public string PredictionType { get; set; } = string.Empty;
    public string? RiskLevel { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public string? Recommendation { get; set; }
    public DateOnly? PredictedForDate { get; set; }

    public Vehicle Vehicle { get; set; } = null!;
}
