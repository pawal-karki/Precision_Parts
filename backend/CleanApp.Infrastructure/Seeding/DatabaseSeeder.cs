using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using CleanApp.Infrastructure.Persistence;

namespace CleanApp.Infrastructure.Seeding;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (!await db.ServiceTypes.AnyAsync())
        {
            var stGeneral = new ServiceType { Code = "SVC-GEN", Name = "General Service", Description = "Routine checks, oil change, and basic diagnostics.", BasePrice = 150m, EstimatedMinutes = 120 };
            var stBrake = new ServiceType { Code = "SVC-BRK", Name = "Brake Inspection & Repair", Description = "Full brake system diagnostic, pad and rotor replacements.", BasePrice = 300m, EstimatedMinutes = 180 };
            var stTransmission = new ServiceType { Code = "SVC-TRN", Name = "Transmission Overhaul", Description = "Deep transmission diagnostics and parts replacement.", BasePrice = 850m, EstimatedMinutes = 360 };
            var stEngine = new ServiceType { Code = "SVC-ENG", Name = "Engine Performance Tuning", Description = "ECU tuning and engine health diagnostics.", BasePrice = 450m, EstimatedMinutes = 240 };
            db.ServiceTypes.AddRange(stGeneral, stBrake, stTransmission, stEngine);
            await db.SaveChangesAsync();
        }

        if (await db.Users.AnyAsync(u => u.Email == "admin@precision-parts.com"))
            return;

        var hash = BCrypt.Net.BCrypt.HashPassword("Demo123!");

        var catEngine = new PartCategory { Name = "Engine" };
        var catBrakes = new PartCategory { Name = "Brakes" };
        var catFasteners = new PartCategory { Name = "Fasteners" };
        var catLubricants = new PartCategory { Name = "Lubricants" };
        var catTransmission = new PartCategory { Name = "Transmission" };
        db.PartCategories.AddRange(catEngine, catBrakes, catFasteners, catLubricants, catTransmission);
        await db.SaveChangesAsync();

        var vEuro = new Vendor { Name = "Euro Precision GmbH", ContactName = "Hans Mueller", Email = "hans@europrecision.de", Phone = "+49 89 1234 5678", City = "Munich", Country = "Germany", Rating = 4.8m, IsActive = true };
        var vBrembo = new Vendor { Name = "Brembo SpA", ContactName = "Marco Rossi", Email = "marco@brembo.it", Phone = "+39 02 3456 7890", City = "Milan", Country = "Italy", Rating = 4.9m, IsActive = true };
        var vFast = new Vendor { Name = "Fastener World Ltd", ContactName = "John Blake", Email = "j.blake@fastworld.co.uk", Phone = "+44 20 7123 4567", City = "Birmingham", Country = "UK", Rating = 4.5m, IsActive = true };
        var vChem = new Vendor { Name = "ChemFlow Industries", ContactName = "Li Wei", Email = "l.wei@chemflow.cn", Phone = "+86 21 5678 9012", City = "Shanghai", Country = "China", Rating = 4.2m, IsActive = true };
        var vApex = new Vendor { Name = "Apex Components", ContactName = "Tyler Brooks", Email = "t.brooks@apexcomp.com", Phone = "+1 313 555 0192", City = "Detroit", Country = "USA", Rating = 4.7m, IsActive = true };
        var vCool = new Vendor { Name = "CoolTech Systems", ContactName = "Aiko Tanaka", Email = "a.tanaka@cooltech.jp", Phone = "+81 3 1234 5678", City = "Tokyo", Country = "Japan", Rating = 4.6m, IsActive = true };
        db.Vendors.AddRange(vEuro, vBrembo, vFast, vChem, vApex, vCool);
        await db.SaveChangesAsync();

        db.Parts.AddRange(
            new Part { Sku = "VC-9921-T", Name = "Titanium Valve Cap", CategoryId = catEngine.Id, VendorId = vEuro.Id, UnitPrice = 24.5m, StockQty = 1204, ReorderLevel = 50, BatchCode = "B02-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse A, Row 2" },
            new Part { Sku = "BT-4410-X", Name = "High-Tensile Bolt Kit", CategoryId = catFasteners.Id, VendorId = vFast.Id, UnitPrice = 18.75m, StockQty = 42, ReorderLevel = 100, BatchCode = "B11-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse B, Row 7" },
            new Part { Sku = "LB-SYN-01", Name = "Synthetic Lube (Grade A)", CategoryId = catLubricants.Id, VendorId = vChem.Id, UnitPrice = 12m, StockQty = 450, ReorderLevel = 200, BatchCode = "Q01-24", UnitOfMeasure = "liters", WarehouseLocation = "Storage Bay C" },
            new Part { Sku = "BR-CCR-08", Name = "Carbon Ceramic Brake Rotor", CategoryId = catBrakes.Id, VendorId = vBrembo.Id, UnitPrice = 189m, StockQty = 385, ReorderLevel = 30, BatchCode = "A05-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse A, Row 5" },
            new Part { Sku = "IM-V8X9", Name = "V8 Intake Manifold X-9", CategoryId = catEngine.Id, VendorId = vApex.Id, UnitPrice = 345m, StockQty = 412, ReorderLevel = 20, BatchCode = "C03-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse A, Row 1" },
            new Part { Sku = "CL-BPB-02", Name = "Brembo Pro Caliper Blue", CategoryId = catBrakes.Id, VendorId = vBrembo.Id, UnitPrice = 425m, StockQty = 310, ReorderLevel = 15, BatchCode = "D08-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse A, Row 6" },
            new Part { Sku = "THB-042", Name = "Titanium Hub Bolts", CategoryId = catFasteners.Id, VendorId = vFast.Id, UnitPrice = 8.5m, StockQty = 8, ReorderLevel = 50, BatchCode = "B15-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse B, Row 3" },
            new Part { Sku = "TC-STG2", Name = "Transmission Cooler Stage 2", CategoryId = catTransmission.Id, VendorId = vCool.Id, UnitPrice = 156m, StockQty = 290, ReorderLevel = 25, BatchCode = "E02-24", UnitOfMeasure = "pcs", WarehouseLocation = "Warehouse C, Row 2" }
        );
        await db.SaveChangesAsync();

        var admin = new User
        {
            Role = UserRole.Admin,
            FullName = "System Admin",
            Email = "admin@precision-parts.com",
            PasswordHash = hash,
            Department = "Operations",
            PositionTitle = "Administrator",
            IsActive = true
        };

        var staffRows = new[]
        {
            ("Sarah Mitchell", "Senior Technician", "Engineering", "s.mitchell@precision.com", true),
            ("James Cooper", "Sales Associate", "Sales", "j.cooper@precision.com", true),
            ("Elena Vasquez", "Inventory Specialist", "Warehouse", "e.vasquez@precision.com", true),
            ("David Park", "Quality Inspector", "Quality Assurance", "d.park@precision.com", true),
            ("Rachel Hughes", "Customer Service Lead", "Support", "r.hughes@precision.com", true),
            ("Marcus Lin", "Procurement Officer", "Procurement", "m.lin@precision.com", false)
        };
        foreach (var (name, title, dept, email, active) in staffRows)
        {
            db.Users.Add(new User
            {
                Role = UserRole.Staff,
                FullName = name,
                Email = email,
                PasswordHash = hash,
                Department = dept,
                PositionTitle = title,
                IsActive = active
            });
        }

        var horizon = new User { Role = UserRole.Customer, FullName = "Horizon Motorsport", Email = "orders@horizonms.com", Phone = "+1 212 555 0198", PasswordHash = hash, IsActive = true };
        var apex = new User { Role = UserRole.Customer, FullName = "Apex Racing Ltd", Email = "procurement@apexracing.co", Phone = "+44 20 7555 0234", PasswordHash = hash, IsActive = true };
        var michael = new User { Role = UserRole.Customer, FullName = "Michael Torres", Email = "m.torres@email.com", Phone = "+1 415 555 0178", PasswordHash = hash, IsActive = true };
        var elena = new User { Role = UserRole.Customer, FullName = "Elena Schmidt", Email = "e.schmidt@email.de", Phone = "+49 30 555 0156", PasswordHash = hash, IsActive = true };
        var pacific = new User { Role = UserRole.Customer, FullName = "Pacific Auto Works", Email = "info@pacificauto.com", Phone = "+1 310 555 0123", PasswordHash = hash, IsActive = true };
        var raj = new User { Role = UserRole.Customer, FullName = "Raj Patel", Email = "raj.p@email.com", Phone = "+91 22 555 0145", PasswordHash = hash, IsActive = false };

        db.Users.AddRange(admin, horizon, apex, michael, elena, pacific, raj);
        await db.SaveChangesAsync();

        db.CustomerProfiles.AddRange(
            new CustomerProfile { UserId = horizon.Id, LoyaltyTier = "Gold", TotalSpent = 24890m, AccountKind = "Business", AccountStatus = "Active", OutstandingCredit = 0, LastOrderDate = new DateOnly(2024, 3, 12) },
            new CustomerProfile { UserId = apex.Id, LoyaltyTier = "Platinum", TotalSpent = 67230m, AccountKind = "Business", AccountStatus = "Credit Overdue", OutstandingCredit = 4200m, LastOrderDate = new DateOnly(2024, 2, 15) },
            new CustomerProfile { UserId = michael.Id, LoyaltyTier = "Silver", TotalSpent = 3420m, AccountKind = "Individual", AccountStatus = "Active", OutstandingCredit = 0, LastOrderDate = new DateOnly(2024, 3, 8) },
            new CustomerProfile { UserId = elena.Id, LoyaltyTier = "Gold", TotalSpent = 8750m, AccountKind = "Individual", AccountStatus = "Active", OutstandingCredit = 0, LastOrderDate = new DateOnly(2024, 3, 10) },
            new CustomerProfile { UserId = pacific.Id, LoyaltyTier = "Platinum", TotalSpent = 41560m, AccountKind = "Business", AccountStatus = "Active", OutstandingCredit = 0, LastOrderDate = new DateOnly(2024, 3, 11) },
            new CustomerProfile { UserId = raj.Id, LoyaltyTier = "Bronze", TotalSpent = 1200m, AccountKind = "Individual", AccountStatus = "Inactive", OutstandingCredit = 0, LastOrderDate = new DateOnly(2023, 11, 20) }
        );
        await db.SaveChangesAsync();

        db.Vehicles.AddRange(
            new Vehicle { CustomerId = horizon.Id, Nickname = "2023 BMW M4", Vin = "WBS21AZ0000000001", MileageKm = 12000, HealthScore = 91, LastServiceDate = new DateOnly(2024, 1, 10) },
            new Vehicle { CustomerId = horizon.Id, Nickname = "2022 Porsche 911", Vin = "WP0ZZZ99ZMS000002", MileageKm = 8000, HealthScore = 94, LastServiceDate = new DateOnly(2024, 2, 1) },
            new Vehicle { CustomerId = apex.Id, Nickname = "2024 Ferrari 296", Vin = "ZFF99XXX00000003", MileageKm = 3000, HealthScore = 88, LastServiceDate = new DateOnly(2024, 1, 5) },
            new Vehicle { CustomerId = apex.Id, Nickname = "2023 McLaren 720S", Vin = "SBM14DCA00000004", MileageKm = 5000, HealthScore = 90, LastServiceDate = new DateOnly(2024, 2, 20) },
            new Vehicle { CustomerId = michael.Id, Nickname = "2021 Toyota Supra", Vin = "JTDBZR0000000005", MileageKm = 22000, HealthScore = 85, LastServiceDate = new DateOnly(2023, 12, 1) },
            new Vehicle { CustomerId = elena.Id, Nickname = "2023 Mercedes AMG GT", Vin = "WDD2130421A123456", MileageKm = 12400, HealthScore = 92, LastServiceDate = new DateOnly(2024, 2, 15) },
            new Vehicle { CustomerId = elena.Id, Nickname = "2020 Audi RS6", Vin = "WUAZZZ4G1LN012345", MileageKm = 34800, HealthScore = 78, LastServiceDate = new DateOnly(2024, 1, 20) }
        );
        await db.SaveChangesAsync();

        var elenaVehicles = await db.Vehicles.Where(v => v.CustomerId == elena.Id).OrderBy(v => v.Nickname).ToListAsync();
        if (elenaVehicles.Count >= 2)
        {
            db.AiPredictions.AddRange(
                new AiPrediction { VehicleId = elenaVehicles[0].Id, PredictionType = "Front Brake Pads", RiskLevel = "High", ConfidenceScore = 87, Recommendation = "Schedule replacement within 2 weeks", PredictedForDate = new DateOnly(2024, 4, 1) },
                new AiPrediction { VehicleId = elenaVehicles[1].Id, PredictionType = "Transmission Fluid", RiskLevel = "Medium", ConfidenceScore = 72, Recommendation = "Fluid change recommended at next service", PredictedForDate = new DateOnly(2024, 5, 1) },
                new AiPrediction { VehicleId = elenaVehicles[0].Id, PredictionType = "Engine Oil", RiskLevel = "Low", ConfidenceScore = 65, Recommendation = "Monitor at next inspection", PredictedForDate = new DateOnly(2024, 6, 1) },
                new AiPrediction { VehicleId = elenaVehicles[1].Id, PredictionType = "Rear Suspension", RiskLevel = "Medium", ConfidenceScore = 78, Recommendation = "Inspect bushings at next service", PredictedForDate = new DateOnly(2024, 4, 15) }
            );
            await db.SaveChangesAsync();
        }

        var rnd = new Random(42);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        for (var m = 0; m < 12; m++)
        {
            var monthDate = today.AddMonths(-11 + m);
            var ym = new DateOnly(monthDate.Year, monthDate.Month, 1);
            for (var k = 0; k < 8; k++)
            {
                var day = rnd.Next(1, DateTime.DaysInMonth(ym.Year, ym.Month));
                var issue = new DateOnly(ym.Year, ym.Month, day);
                var sub = (decimal)rnd.Next(800, 12000);
                var tax = Math.Round(sub * 0.08m, 2);
                var inv = new Invoice
                {
                    InvoiceNumber = $"INV-{issue:yyyyMMdd}-{m:D2}-{k:D2}-{Guid.NewGuid().ToString("N")[..6]}",
                    CustomerId = new[] { horizon.Id, michael.Id, elena.Id, pacific.Id }[rnd.Next(4)],
                    IssueDate = issue,
                    DueDate = issue.AddDays(30),
                    Status = InvoiceStatus.Paid,
                    Subtotal = sub,
                    TaxAmount = tax,
                    DiscountAmount = 0,
                    TotalAmount = sub + tax,
                    BalanceDue = 0
                };
                db.Invoices.Add(inv);
            }
        }
        await db.SaveChangesAsync();

        foreach (var inv in await db.Invoices.ToListAsync())
        {
            db.InvoiceItems.Add(new InvoiceItem
            {
                InvoiceId = inv.Id,
                ItemType = "part",
                Description = "Parts order line",
                Quantity = 1,
                UnitPrice = inv.Subtotal,
                LineTotal = inv.Subtotal
            });
        }
        await db.SaveChangesAsync();

        db.Notifications.AddRange(
            new Notification { UserId = admin.Id, Title = "Critical: Low Stock Alert", Message = "Titanium Hub Bolts (SKU: THB-042) stock at 8 units — below minimum threshold of 50.", Severity = NotificationSeverity.Error, Category = "inventory", IsRead = false },
            new Notification { UserId = admin.Id, Title = "Credit Overdue", Message = "Apex Racing Ltd account balance overdue by 32 days. Outstanding: $4,200.00", Severity = NotificationSeverity.Warning, Category = "billing", IsRead = false },
            new Notification { UserId = admin.Id, Title = "Shipment Update", Message = "PO-2024-002 from Brembo SpA has shipped. Expected arrival: March 18.", Severity = NotificationSeverity.Info, Category = "procurement", IsRead = false }
        );

        await db.SaveChangesAsync();
    }
}
