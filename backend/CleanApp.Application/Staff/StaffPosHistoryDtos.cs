namespace CleanApp.Application.Staff;

public sealed record StaffPosSaleListItemDto(
    Guid Id,
    string InvoiceNumber,
    DateTime IssueDate,
    string Status,
    decimal TotalAmount,
    decimal BalanceDue,
    bool OnAccount,
    Guid? CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    Guid? SoldByUserId,
    string? SoldByName,
    string? StaffNotes);

public sealed record StaffPosSaleLineDto(
    string Description,
    string ItemType,
    decimal Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record StaffPosPaymentRowDto(
    DateTime PaidAtUtc,
    decimal Amount,
    string Method,
    string? Reference);

public sealed record StaffPosSaleDetailDto(
    Guid Id,
    string InvoiceNumber,
    DateTime IssueDate,
    DateTime? DueDate,
    string Status,
    decimal Subtotal,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    decimal BalanceDue,
    Guid? CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    Guid? SoldByUserId,
    string? SoldByName,
    string? StaffNotes,
    IReadOnlyList<StaffPosSaleLineDto> Lines,
    IReadOnlyList<StaffPosPaymentRowDto> Payments);

public sealed class UpdateStaffPosSaleDto
{
    /// <summary>When non-null, replaces internal staff notes.</summary>
    public string? StaffNotes { get; set; }

    /// <summary>Due date (yyyy-MM-dd or ISO). When null/empty, due date is not changed.</summary>
    public string? DueDateIso { get; set; }

    /// <summary>Record that the customer paid the open balance at the counter (marks invoice paid).</summary>
    public bool MarkCollectedAtCounter { get; set; }
}
