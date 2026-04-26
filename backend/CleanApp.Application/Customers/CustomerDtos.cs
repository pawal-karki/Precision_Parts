namespace CleanApp.Application.Customers;

public class CustomerListItemDto
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
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

public class ProfileUpdateDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ImageUrl { get; set; }
    public string? Region { get; set; }
}

// ── CRM Detailed Report ───────────────────────────────────────────────────

public class CustomerDetailReportDto
{
    public int PublicId { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public string LoyaltyTier { get; set; } = "";
    public string AccountKind { get; set; } = "";
    public string AccountStatus { get; set; } = "";
    public decimal TotalSpent { get; set; }
    public decimal OutstandingCredit { get; set; }
    public int VehicleCount { get; set; }
    public int AppointmentCount { get; set; }
    public int InvoiceCount { get; set; }
    public int PartRequestCount { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public List<RecentPurchaseDto> RecentPurchases { get; set; } = new();
    public List<RecentPurchaseDto> FullPurchases { get; set; } = new();
    public List<CustomerAppointmentDto> Appointments { get; set; } = new();
    public List<VehicleSummaryDto> Vehicles { get; set; } = new();
}

public class RecentPurchaseDto
{
    public string InvoiceNumber { get; set; } = "";
    public DateTime IssueDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "";
}

public class CustomerAppointmentDto
{
    public Guid Id { get; set; }
    public string ReferenceNumber { get; set; } = "";
    public DateTime ScheduledAtUtc { get; set; }
    public string Status { get; set; } = "";
    public string Notes { get; set; } = "";
    public string VehicleName { get; set; } = "";
    public List<string> Services { get; set; } = new();
}

public class VehicleSummaryDto
{
    public string Nickname { get; set; } = "";
    public string Vin { get; set; } = "";
    public int MileageKm { get; set; }
    public int HealthScore { get; set; }
}

// ── Paginated Activity Log ────────────────────────────────────────────────

public class ActivityLogItemDto
{
    public string Type { get; set; } = "";       // "Booking" | "Invoice" | "PartRequest"
    public string Icon { get; set; } = "";
    public string Title { get; set; } = "";
    public string Detail { get; set; } = "";
    public string Amount { get; set; } = "";
    public DateTime Timestamp { get; set; }
}

// ── Login Activity ────────────────────────────────────────────────────────

public class LoginActivityItemDto
{
    public DateTime TimestampUtc { get; set; }
    public string IpAddress { get; set; } = "—";
    public string Device { get; set; } = "Unknown";
    public bool IsActive { get; set; }
}

// ── Generic Paged Result ──────────────────────────────────────────────────

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
