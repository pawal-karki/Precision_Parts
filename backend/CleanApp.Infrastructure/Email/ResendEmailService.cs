using CleanApp.Application.Email;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Resend;
using AppEmailMessage = CleanApp.Application.Email.EmailMessage;
using ResendMessage = Resend.EmailMessage;

namespace CleanApp.Infrastructure.Email;

/// <summary>Implements <see cref="IEmailService"/> using the Resend SDK.</summary>
public sealed class ResendEmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly ResendEmailOptions _opts;
    private readonly ILogger<ResendEmailService> _log;

    public ResendEmailService(IResend resend, IOptions<ResendEmailOptions> opts, ILogger<ResendEmailService> log)
    {
        _resend = resend;
        _opts   = opts.Value;
        _log    = log;
    }

    // ── Generic send ────────────────────────────────────────────────────────

    public async Task SendAsync(AppEmailMessage message, CancellationToken ct = default)
    {
        var msg = new ResendMessage
        {
            From     = message.From,
            Subject  = message.Subject,
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody,
        };
        msg.To.Add(message.To);

        try
        {
            await _resend.EmailSendAsync(msg, ct);
            _log.LogInformation("Email sent to {To} – subject: {Subject}", message.To, message.Subject);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Failed to send email to {To}", message.To);
            throw;
        }
    }

    // ── Welcome email ────────────────────────────────────────────────────────

    public Task SendWelcomeAsync(string toEmail, string fullName, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From    = _opts.From,
            To      = toEmail,
            Subject = "Welcome to Precision Parts 🔧",
            HtmlBody = WelcomeHtml(fullName),
        }, ct);

    // ── Low-stock alert ──────────────────────────────────────────────────────

    public Task SendLowStockAlertAsync(string toEmail, IReadOnlyList<LowStockItem> items, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From    = _opts.From,
            To      = toEmail,
            Subject = $"Low Stock Alert – {items.Count} item(s) need attention",
            HtmlBody = LowStockHtml(items),
        }, ct);

    // ── Overdue credit reminder ──────────────────────────────────────────────

    public Task SendOverdueCreditReminderAsync(string toEmail, string customerName, decimal amount, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From    = _opts.From,
            To      = toEmail,
            Subject = "Overdue Balance Reminder – Precision Parts",
            HtmlBody = OverdueCreditHtml(customerName, amount),
        }, ct);

    // ── Invoice receipt ──────────────────────────────────────────────────────

    public Task SendInvoiceReceiptAsync(string toEmail, string customerName, string invoiceRef, decimal total, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From    = _opts.From,
            To      = toEmail,
            Subject = $"Your Precision Parts Invoice – {invoiceRef}",
            HtmlBody = InvoiceHtml(customerName, invoiceRef, total),
        }, ct);

    public Task SendResetPasswordOtpAsync(string toEmail, string fullName, string otp, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From    = _opts.From,
            To      = toEmail,
            Subject = "Password Reset OTP – Precision Parts",
            HtmlBody = ResetPasswordOtpHtml(fullName, otp),
        }, ct);

    // ── HTML templates ───────────────────────────────────────────────────────

    private static string WelcomeHtml(string name) => $"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb">
          <h2 style="color:#1a1a1a;margin-top:0">Welcome aboard, {name}! 👋</h2>
          <p style="color:#4b5563">Your Precision Parts account is ready. You can now browse thousands of industrial parts, track your orders and manage service appointments.</p>
          <a href="https://precisionparts.app" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4d6172;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Visit Your Dashboard</a>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0">
          <p style="color:#9ca3af;font-size:12px;margin:0">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>
        """;

    private static string LowStockHtml(IReadOnlyList<LowStockItem> items)
    {
        var rows = string.Join("", items.Select(i => $"""
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">{i.Name}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace">{i.Sku}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#ef4444;font-weight:600">{i.Stock}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">{i.ReorderLevel}</td>
            </tr>
            """));

        return $"""
            <div style="font-family:Inter,sans-serif;max-width:700px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb">
              <h2 style="color:#ef4444;margin-top:0">⚠️ Low Stock Alert</h2>
              <p style="color:#4b5563">{items.Count} part(s) have fallen below their reorder threshold:</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px">
                <thead>
                  <tr style="background:#f9fafb">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280">Part</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280">SKU</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280">Current Stock</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280">Reorder Level</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </table>
              <a href="https://precisionparts.app/admin/inventory" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#4d6172;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Manage Inventory</a>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0">
              <p style="color:#9ca3af;font-size:12px;margin:0">This alert was generated automatically by Precision Parts.</p>
            </div>
            """;
    }

    private static string OverdueCreditHtml(string name, decimal amount) => $"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb">
          <h2 style="color:#f59e0b;margin-top:0">Outstanding Balance Reminder</h2>
          <p style="color:#4b5563">Dear {name},</p>
          <p style="color:#4b5563">Your account has an overdue balance of <strong>Rs. {amount:N2}</strong>. Please clear this balance at your earliest convenience to avoid service disruptions.</p>
          <a href="https://precisionparts.app/account" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f59e0b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">View Account</a>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0">
          <p style="color:#9ca3af;font-size:12px;margin:0">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>
        """;

    private static string InvoiceHtml(string name, string invoiceRef, decimal total) => $"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb">
          <h2 style="color:#1a1a1a;margin-top:0">Invoice Confirmation</h2>
          <p style="color:#4b5563">Dear {name}, thank you for your purchase.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase">Invoice Reference</p>
            <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#1a1a1a">{invoiceRef}</p>
          </div>
          <div style="background:#f9fafb;border-radius:8px;padding:20px">
            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase">Total Paid</p>
            <p style="margin:0;font-size:24px;font-weight:800;color:#4d6172">Rs. {total:N2}</p>
          </div>
          <a href="https://precisionparts.app/account/orders" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#4d6172;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">View Order History</a>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0">
          <p style="color:#9ca3af;font-size:12px;margin:0">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>
        """;

    private static string ResetPasswordOtpHtml(string name, string otp) => $"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb">
          <h2 style="color:#1a1a1a;margin-top:0">Password Reset Request</h2>
          <p style="color:#4b5563">Dear {name},</p>
          <p style="color:#4b5563">We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:</p>
          <div style="background:#f9fafb;border-radius:8px;padding:24px;margin:24px 0;text-align:center">
            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px">Your Security Code</p>
            <p style="margin:0;font-family:monospace;font-size:36px;font-weight:800;color:#4d6172;letter-spacing:8px">{otp}</p>
          </div>
          <p style="color:#ef4444;font-size:13px">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0">
          <p style="color:#9ca3af;font-size:12px;margin:0">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>
        """;
}
