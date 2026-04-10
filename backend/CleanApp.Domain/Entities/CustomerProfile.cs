namespace CleanApp.Domain.Entities;

public class CustomerProfile
{
    public Guid UserId { get; set; }
    public string LoyaltyTier { get; set; } = "standard";
    public decimal TotalSpent { get; set; }
    public string PreferredContact { get; set; } = "email";
    public string AccountKind { get; set; } = "Individual";
    public string AccountStatus { get; set; } = "Active";
    public decimal OutstandingCredit { get; set; }
    public DateOnly? LastOrderDate { get; set; }

    public User User { get; set; } = null!;
}
