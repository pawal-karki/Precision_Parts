namespace CleanApp.Application.Customers;

public class CustomerListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Status { get; set; } = "";
    public string TotalSpent { get; set; } = "";
    public string LoyaltyTier { get; set; } = "";
    public List<string> Vehicles { get; set; } = new();
    public string LastOrder { get; set; } = "";
    public double Credit { get; set; }
}

public class CustomerCreateDto
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "Individual";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public string Status { get; set; } = "Active";
    public string LoyaltyTier { get; set; } = "Bronze";
    public List<string> Vehicles { get; set; } = new();
    public string? LastOrder { get; set; }
    public decimal Credit { get; set; }
}

public class CustomerUpdateDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public string? LoyaltyTier { get; set; }
    public List<string>? Vehicles { get; set; }
    public string? LastOrder { get; set; }
    public decimal? Credit { get; set; }
}
