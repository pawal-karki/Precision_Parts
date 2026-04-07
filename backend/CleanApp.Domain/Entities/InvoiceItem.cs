namespace CleanApp.Domain.Entities;

public class InvoiceItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public string ItemType { get; set; } = "service";
    public Guid? RefId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }

    public Invoice Invoice { get; set; } = null!;
}
     