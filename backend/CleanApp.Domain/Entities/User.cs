using CleanApp.Domain.Enums;

namespace CleanApp.Domain.Entities;

public class User : BaseEntity
{
    /// <summary>Stable integer id for public APIs (staff customer profile URLs).</summary>
    public int PublicId { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? EmailVerifiedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    /// <summary>Staff department (Admin/Staff roles).</summary>
    public string? Department { get; set; }
    /// <summary>Job title shown in staff directory (e.g. Senior Technician).</summary>
    public string? PositionTitle { get; set; }

    public CustomerProfile? CustomerProfile { get; set; }
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
