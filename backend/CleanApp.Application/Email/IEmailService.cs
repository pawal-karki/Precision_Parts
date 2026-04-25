namespace CleanApp.Application.Email;

/// <summary>Abstraction over any transactional email provider (Resend, SendGrid, etc.).</summary>
public interface IEmailService
{
    /// <summary>Send a plain HTML email.</summary>
    Task SendAsync(EmailMessage message, CancellationToken ct = default);

    /// <summary>Send a welcome email after customer registration.</summary>
    Task SendWelcomeAsync(string toEmail, string fullName, CancellationToken ct = default);

    /// <summary>Send a low-stock alert to a staff / admin address.</summary>
    Task SendLowStockAlertAsync(string toEmail, IReadOnlyList<LowStockItem> items, CancellationToken ct = default);

    /// <summary>Send an overdue-credit reminder to a customer.</summary>
    Task SendOverdueCreditReminderAsync(string toEmail, string customerName, decimal amount, CancellationToken ct = default);

    /// <summary>Send an invoice / receipt to a customer.</summary>
    Task SendInvoiceReceiptAsync(string toEmail, string customerName, string invoiceRef, decimal total, CancellationToken ct = default);

    /// <summary>Send a password reset OTP.</summary>
    Task SendResetPasswordOtpAsync(string toEmail, string fullName, string otp, CancellationToken ct = default);
}

/// <summary>A generic email payload.</summary>
public sealed class EmailMessage
{
    public required string From    { get; init; }
    public required string To      { get; init; }
    public required string Subject { get; init; }
    public string? HtmlBody        { get; init; }
    public string? TextBody        { get; init; }
}

/// <summary>A snapshot of a low-stock part for alert emails.</summary>
public sealed class LowStockItem
{
    public required string Name        { get; init; }
    public required string Sku         { get; init; }
    public          int    Stock       { get; init; }
    public          int    ReorderLevel { get; init; }
}
