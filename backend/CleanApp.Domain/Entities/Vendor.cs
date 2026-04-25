namespace CleanApp.Domain.Entities;

public class Vendor : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public decimal Rating { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Part> Parts { get; set; } = new List<Part>();
}
