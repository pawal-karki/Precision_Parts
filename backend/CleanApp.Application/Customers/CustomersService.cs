using System;
using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.Customers;

public class CustomersService : ICustomersService
{
    private readonly ICustomerRepository _customers;

    public CustomersService(ICustomerRepository customers) => _customers = customers;

    public async Task<IReadOnlyList<CustomerListItemDto>> ListForStaffAsync(CancellationToken cancellationToken = default)
    {
        var list = await _customers.ListCustomersWithProfileAndVehiclesOrderedAsync(cancellationToken);
        var partCounts = await _customers.GetPartRequestCountsByCustomerIdAsync(cancellationToken);
        return list.Select(u =>
        {
            var p = u.CustomerProfile;
            var status = p?.AccountStatus ?? (u.IsActive ? "Active" : "Inactive");
            return new CustomerListItemDto
            {
                Id = u.PublicId,
                UserId = u.Id,
                Name = u.FullName,
                Type = p?.AccountKind ?? "Individual",
                Email = u.Email,
                Phone = u.Phone ?? "",
                Status = status,
                TotalSpent = DisplayMoney.Format(p?.TotalSpent ?? 0, 0),
                LoyaltyTier = p?.LoyaltyTier ?? "Bronze",
                Vehicles = u.Vehicles.Select(v => v.Nickname ?? $"{v.Year} {v.Make} {v.Model}".Trim()).Where(s => !string.IsNullOrWhiteSpace(s)).ToList(),
                LastOrder = p?.LastOrderDate?.ToString("yyyy-MM-dd") ?? u.CreatedAtUtc.ToString("yyyy-MM-dd"),
                Credit = (double)(p?.OutstandingCredit ?? 0),
                PartRequestCount = partCounts.GetValueOrDefault(u.Id, 0)
            };
        }).ToList();
    }

    public async Task<int> CreateAsync(CustomerCreateDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email))
            throw new ArgumentException("Name and Email are required.");

        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _customers.EmailExistsNormalizedAsync(email, cancellationToken))
            throw new InvalidOperationException("A user with this email already exists.");

        var hash = BCrypt.Net.BCrypt.HashPassword("Demo123!");
        var user = new User
        {
            Role = UserRole.Customer,
            FullName = dto.Name.Trim(),
            Email = dto.Email.Trim(),
            Phone = dto.Phone,
            PasswordHash = hash,
            IsActive = dto.Status != "Inactive"
        };
        _customers.Add(user);
        await _customers.SaveChangesAsync(cancellationToken);

        DateOnly? lastOrder = null;
        if (!string.IsNullOrWhiteSpace(dto.LastOrder) && DateOnly.TryParse(dto.LastOrder, out var lo))
            lastOrder = lo;

        var profile = new CustomerProfile
        {
            UserId = user.Id,
            LoyaltyTier = dto.LoyaltyTier,
            TotalSpent = 0,
            AccountKind = dto.Type,
            AccountStatus = dto.Status,
            OutstandingCredit = dto.Credit,
            LastOrderDate = lastOrder
        };
        _customers.AddProfile(profile);

        foreach (var nick in dto.Vehicles.Where(v => !string.IsNullOrWhiteSpace(v)))
            _customers.AddVehicle(new Vehicle { CustomerId = user.Id, Nickname = nick.Trim() });

        await _customers.SaveChangesAsync(cancellationToken);
        return user.PublicId;
    }

    public async Task UpdateAsync(int publicId, CustomerUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByPublicIdWithDetailsAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        if (!string.IsNullOrWhiteSpace(dto.Name)) user.FullName = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email.Trim();
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Status != null)
        {
            user.IsActive = dto.Status != "Inactive";
            if (user.CustomerProfile != null)
                user.CustomerProfile.AccountStatus = dto.Status;
        }

        if (user.CustomerProfile != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Type)) user.CustomerProfile.AccountKind = dto.Type;
            if (!string.IsNullOrWhiteSpace(dto.LoyaltyTier)) user.CustomerProfile.LoyaltyTier = dto.LoyaltyTier;
            if (dto.Credit.HasValue) user.CustomerProfile.OutstandingCredit = dto.Credit.Value;
            if (!string.IsNullOrWhiteSpace(dto.LastOrder) && DateOnly.TryParse(dto.LastOrder, out var lo))
                user.CustomerProfile.LastOrderDate = lo;
        }

        if (dto.Vehicles != null)
        {
            _customers.RemoveVehicles(user.Vehicles);
            foreach (var nick in dto.Vehicles.Where(v => !string.IsNullOrWhiteSpace(v)))
                _customers.AddVehicle(new Vehicle { CustomerId = user.Id, Nickname = nick.Trim() });
        }

        user.UpdatedAtUtc = DateTime.UtcNow;
        await _customers.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(int publicId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByPublicIdWithDetailsAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");
        _customers.Remove(user);
        await _customers.SaveChangesAsync(cancellationToken);
    }

    // ── CRM Detailed Report ───────────────────────────────────────────────

    public async Task<CustomerDetailReportDto> GetDetailedReportAsync(int publicId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerFullCrmAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        var p = user.CustomerProfile;

        // Top-5 most recent purchases
        var recentPurchases = user.Invoices
            .OrderByDescending(i => i.IssueDate)
            .Take(5)
            .Select(i => new RecentPurchaseDto
            {
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                TotalAmount = i.TotalAmount,
                Status = i.Status.ToString()
            }).ToList();

        // All purchases (full history)
        var allPurchases = user.Invoices
            .OrderByDescending(i => i.IssueDate)
            .Select(i => new RecentPurchaseDto
            {
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                TotalAmount = i.TotalAmount,
                Status = i.Status.ToString()
            }).ToList();

        // All appointments
        var appointments = user.Appointments
            .OrderByDescending(a => a.ScheduledAtUtc)
            .Select(a => new CustomerAppointmentDto
            {
                Id = a.Id,
                ReferenceNumber = $"SRV-{a.Id.ToString()[..6].ToUpper()}",
                ScheduledAtUtc = a.ScheduledAtUtc,
                Status = a.Status.ToString(),
                Notes = a.Notes ?? "",
                VehicleName = a.Vehicle?.Nickname ?? (a.Vehicle != null ? $"{a.Vehicle.Year} {a.Vehicle.Make}" : "—"),
                Services = a.Services.Select(s => s.ServiceType?.Name ?? "Service").ToList()
            }).ToList();

        var partRequests = await _customers.ListPartRequestsForCustomerAsync(user.Id, cancellationToken);
        var partRequestRows = partRequests.Select(pr => new CustomerPartRequestRowDto
        {
            Id = pr.Id,
            PartName = pr.PartName,
            PartNumber = pr.PartNumber,
            VehicleModel = pr.VehicleModel,
            Description = pr.Description,
            Urgency = pr.Urgency,
            Status = pr.Status,
            CreatedAtUtc = pr.CreatedAtUtc
        }).ToList();

        return new CustomerDetailReportDto
        {
            PublicId = user.PublicId,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            IsActive = user.IsActive,
            LoyaltyTier = p?.LoyaltyTier ?? "Bronze",
            AccountKind = p?.AccountKind ?? "Individual",
            AccountStatus = p?.AccountStatus ?? "Active",
            TotalSpent = p?.TotalSpent ?? 0,
            OutstandingCredit = p?.OutstandingCredit ?? 0,
            VehicleCount = user.Vehicles.Count,
            AppointmentCount = user.Appointments.Count,
            InvoiceCount = user.Invoices.Count,
            PartRequestCount = partRequestRows.Count,
            LastLoginAtUtc = user.LastLoginAtUtc,
            PartRequests = partRequestRows,
            RecentPurchases = recentPurchases,
            FullPurchases = allPurchases,
            Appointments = appointments,
            Vehicles = user.Vehicles.Select(v => new VehicleSummaryDto
            {
                Nickname = v.Nickname ?? "",
                Vin = v.Vin ?? "",
                MileageKm = v.MileageKm ?? 0,
                HealthScore = v.HealthScore ?? 0
            }).ToList()
        };
    }

    // ── Paginated Activity Log ────────────────────────────────────────────

    public async Task<PagedResult<ActivityLogItemDto>> GetActivityLogAsync(
        int publicId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByPublicIdWithDetailsAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        var (appointments, invoices, partRequests) =
            await _customers.GetActivityDataAsync(user.Id, cancellationToken);

        // Merge into unified chronological stream
        var stream = new List<ActivityLogItemDto>();

        stream.AddRange(appointments.Select(a => new ActivityLogItemDto
        {
            Type = "Booking",
            Icon = "event",
            Title = $"Service Booking — {a.Status}",
            Detail = a.Notes ?? "No notes",
            Amount = "",
            Timestamp = a.ScheduledAtUtc
        }));

        stream.AddRange(invoices.Select(i => new ActivityLogItemDto
        {
            Type = "Invoice",
            Icon = "receipt_long",
            Title = $"Invoice {i.InvoiceNumber}",
            Detail = i.Status.ToString(),
            Amount = DisplayMoney.Format(i.TotalAmount),
            Timestamp = i.IssueDate
        }));

        stream.AddRange(partRequests.Select(pr => new ActivityLogItemDto
        {
            Type = "PartRequest",
            Icon = "build",
            Title = $"Part Request — {pr.PartName}",
            Detail = pr.Status,
            Amount = "",
            Timestamp = pr.CreatedAtUtc
        }));

        var sorted = stream.OrderByDescending(x => x.Timestamp).ToList();
        var total = sorted.Count;
        var items = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<ActivityLogItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    // ── Login Activity (persisted sign-ins) ───────────────────────────────

    public async Task<PagedResult<LoginActivityItemDto>> GetLoginActivityAsync(
        int publicId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByPublicIdWithDetailsAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        var latestId = await _customers.GetLatestUserLoginAuditIdAsync(user.Id, cancellationToken);
        var (audits, total) = await _customers.ListUserLoginAuditsAsync(user.Id, page, pageSize, cancellationToken);

        var items = audits.Select(a => new LoginActivityItemDto
        {
            Id = a.Id,
            TimestampUtc = a.OccurredAtUtc,
            IpAddress = string.IsNullOrWhiteSpace(a.IpAddress) ? "—" : a.IpAddress,
            Device = FormatLoginDeviceLabel(a.UserAgent),
            IsActive = user.IsActive && latestId.HasValue && a.Id == latestId.Value
        }).ToList();

        return new PagedResult<LoginActivityItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    private static string FormatLoginDeviceLabel(string? userAgent)
    {
        if (string.IsNullOrWhiteSpace(userAgent))
            return "Unknown";

        var s = userAgent.Trim();
        return s.Length <= 120 ? s : s[..120] + "…";
    }

    public async Task<List<CustomerAppointmentDto>> GetServiceHistoryAsync(int publicId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerFullCrmAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        return user.Appointments
            .OrderByDescending(a => a.ScheduledAtUtc)
            .Select(a => new CustomerAppointmentDto
            {
                Id = a.Id,
                ReferenceNumber = $"SRV-{a.Id.ToString()[..6].ToUpper()}",
                ScheduledAtUtc = a.ScheduledAtUtc,
                Status = a.Status.ToString(),
                Notes = a.Notes ?? "",
                VehicleName = a.Vehicle?.Nickname ?? (a.Vehicle != null ? $"{a.Vehicle.Year} {a.Vehicle.Make}" : "—"),
                Services = a.Services.Select(s => s.ServiceType?.Name ?? "Service").ToList()
            }).ToList();
    }

    public async Task<List<RecentPurchaseDto>> GetPurchasesAsync(int publicId, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerFullCrmAsync(publicId, cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        return user.Invoices
            .OrderByDescending(i => i.IssueDate)
            .Select(i => new RecentPurchaseDto
            {
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                TotalAmount = i.TotalAmount,
                Status = i.Status.ToString()
            }).ToList();
    }

    public async Task UpdateProfileAsync(Guid userId, ProfileUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("User not found.");

        if (dto.FullName != null) user.FullName = dto.FullName;
        if (dto.Email != null) user.Email = dto.Email;
        if (dto.Phone != null) user.Phone = dto.Phone;
        if (dto.Region != null) user.Region = dto.Region;
        if (dto.ImageUrl != null) user.ImageUrl = dto.ImageUrl;

        user.UpdatedAtUtc = DateTime.UtcNow;
        await _customers.SaveChangesAsync(cancellationToken);
    }
}
