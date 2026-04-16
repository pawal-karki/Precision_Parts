using CleanApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<CustomerProfile> CustomerProfiles => Set<CustomerProfile>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<PartCategory> PartCategories => Set<PartCategory>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<ServiceCenter> ServiceCenters => Set<ServiceCenter>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<AppointmentService> AppointmentServices => Set<AppointmentService>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<AiPrediction> AiPredictions => Set<AiPrediction>();
    public DbSet<PartRequest> PartRequests => Set<PartRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.PublicId).IsUnique();
            entity.Property(x => x.PublicId).UseIdentityByDefaultColumn();

            entity.HasOne(x => x.CustomerProfile)
                .WithOne(x => x.User)
                .HasForeignKey<CustomerProfile>(x => x.UserId);

            entity.HasMany(x => x.Vehicles)
                .WithOne(x => x.Customer)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Appointments)
                .WithOne(x => x.Customer)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(x => x.Invoices)
                .WithOne(x => x.Customer)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(x => x.Notifications)
                .WithOne(x => x.User)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Reviews)
                .WithOne(x => x.Customer)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CustomerProfile>(entity =>
        {
            entity.HasKey(x => x.UserId);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasIndex(x => x.Vin).IsUnique();

            entity.HasMany(x => x.Appointments)
                .WithOne(x => x.Vehicle)
                .HasForeignKey(x => x.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(x => x.AiPredictions)
                .WithOne(x => x.Vehicle)
                .HasForeignKey(x => x.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PartCategory>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasMany(x => x.Parts)
                .WithOne(x => x.Category)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasMany(x => x.Parts)
                .WithOne(x => x.Vendor)
                .HasForeignKey(x => x.VendorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Part>(entity =>
        {
            entity.HasIndex(x => x.Sku).IsUnique();
        });

        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<ServiceCenter>(entity =>
        {
            entity.HasMany(x => x.Appointments)
                .WithOne(x => x.ServiceCenter)
                .HasForeignKey(x => x.ServiceCenterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasMany(x => x.Services)
                .WithOne(x => x.Appointment)
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Invoices)
                .WithOne(x => x.Appointment)
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AppointmentService>(entity =>
        {
            entity.HasKey(x => new { x.AppointmentId, x.ServiceTypeId });

            entity.HasOne(x => x.ServiceType)
                .WithMany(x => x.AppointmentServices)
                .HasForeignKey(x => x.ServiceTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(x => x.InvoiceNumber).IsUnique();

            entity.HasMany(x => x.Items)
                .WithOne(x => x.Invoice)
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Payments)
                .WithOne(x => x.Invoice)
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasOne(x => x.Appointment)
                .WithMany()
                .HasForeignKey(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
