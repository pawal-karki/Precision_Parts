namespace CleanApp.Domain.Entities;

public class MonthlyProjection : BaseEntity
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal ProjectedAmount { get; set; }
}
