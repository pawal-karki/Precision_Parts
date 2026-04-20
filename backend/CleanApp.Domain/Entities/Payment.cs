namespace CleanApp.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid? CustomerId { get; set; }
    public string PaymentMethod { get; set; } = "card";
    public decimal Amount { get; set; }
    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
    public string? TransactionReference { get; set; }
    public string Status { get; set; } = "success";

    public Invoice Invoice { get; set; } = null!;
    public User? Customer { get; set; }
}
