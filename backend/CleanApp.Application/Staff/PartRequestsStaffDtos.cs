namespace CleanApp.Application.Staff;

public class StaffPartRequestListItemDto
{
    public Guid Id { get; set; }
    public int CustomerPublicId { get; set; }
    public string CustomerName { get; set; } = "";
    public string CustomerEmail { get; set; } = "";
    public string PartName { get; set; } = "";
    public string? PartNumber { get; set; }
    public string? VehicleModel { get; set; }
    public string? Description { get; set; }
    public string? Urgency { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}

public class UpdatePartRequestStatusDto
{
    public string Status { get; set; } = "";
}
