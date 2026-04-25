namespace CleanApp.Application.Vendors;

public record VendorAdminRowDto(
    Guid Id,
    string Name,
    string? ContactName,
    string? Email,
    string? Phone,
    string? City,
    string? Country,
    decimal Rating,
    int PartCount,
    bool IsActive
);

public record VendorCreateDto(
    string Name,
    string? ContactName,
    string? Email,
    string? Phone,
    string? Address,
    string? City,
    string? Country,
    decimal Rating
);

public record VendorUpdateDto(
    string Name,
    string? ContactName,
    string? Email,
    string? Phone,
    string? Address,
    string? City,
    string? Country,
    decimal Rating,
    bool IsActive
);
