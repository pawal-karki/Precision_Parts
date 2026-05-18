using CleanApp.Application.Email;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using AppEmailMessage = CleanApp.Application.Email.EmailMessage;

namespace CleanApp.Infrastructure.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _log;
    private readonly string _host;
    private readonly int _port;
    private readonly string _user;
    private readonly string _pass;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public SmtpEmailService(ILogger<SmtpEmailService> log, IConfiguration config)
    {
        _log = log;
        _host = config["Smtp:Host"] ?? config["Smtp__Host"] ?? "smtp.gmail.com";
        _port = int.Parse(config["Smtp:Port"] ?? config["Smtp__Port"] ?? "587");
        _user = config["Smtp:User"] ?? config["Smtp__User"] ?? "";
        _pass = config["Smtp:Pass"] ?? config["Smtp__Pass"] ?? "";
        _fromEmail = config["Smtp:FromEmail"] ?? config["Smtp__FromEmail"] ?? _user;
        _fromName = config["Smtp:FromName"] ?? config["Smtp__FromName"] ?? "Precision Parts";
    }

    public async Task SendAsync(AppEmailMessage message, byte[]? attachment = null, string? attachmentName = null, CancellationToken ct = default)
    {
        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(_fromName, _fromEmail));
        email.To.Add(MailboxAddress.Parse(message.To));
        email.Subject = message.Subject;

        var builder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody
        };

        if (attachment != null && attachmentName != null)
            builder.Attachments.Add(attachmentName, attachment);

        email.Body = builder.ToMessageBody();

        // Use a dedicated 30-second timeout so the HTTP request's CancellationToken
        // (which fires when the client disconnects / request times out) cannot abort
        // an in-flight SMTP connection.  We still honour explicit app-level cancellation
        // via a linked token.
        using var smtpCts = CancellationTokenSource.CreateLinkedTokenSource(CancellationToken.None);
        smtpCts.CancelAfter(TimeSpan.FromSeconds(30));
        var smtpToken = smtpCts.Token;

        using var client = new SmtpClient();
        try
        {
            _log.LogInformation("Connecting to SMTP server {Host}:{Port}...", _host, _port);

            // Port 465 → Implicit SSL; 587/25 → STARTTLS
            var socketOptions = _port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(_host, _port, socketOptions, smtpToken);

            _log.LogInformation("Authenticating as {User}...", _user);
            await client.AuthenticateAsync(_user, _pass.Replace(" ", ""), smtpToken);

            _log.LogInformation("Sending email to {To}...", message.To);
            await client.SendAsync(email, smtpToken);

            await client.DisconnectAsync(true, smtpToken);
            _log.LogInformation("Email sent successfully to {To}", message.To);
        }
        catch (OperationCanceledException) when (smtpCts.IsCancellationRequested)
        {
            _log.LogError(
                "SMTP connect to {Host}:{Port} timed out (30 s). " +
                "Check that the server can reach the host and that the port is not blocked. " +
                "Tip: port 587 (STARTTLS) is usually open where 465 is blocked.",
                _host, _port);
            throw new Exception(
                $"SMTP connection to {_host}:{_port} timed out. " +
                "The server may be blocking outbound connections on that port. " +
                "Try changing Smtp:Port to 587 in your configuration.", null);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "MailKit failed to send email to {To}. Host: {Host}, Port: {Port}, User: {User}",
                message.To, _host, _port, _user);

            if (ex.Message.Contains("Authentication failed"))
                throw new Exception("SMTP Authentication failed. Please check your Gmail App Password and ensure it doesn't have spaces.", ex);

            throw;
        }
    }

    public Task SendWelcomeAsync(string toEmail, string fullName, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = "Welcome to Precision Parts 🔧",
            HtmlBody = WelcomeHtml(fullName),
        }, null, null, ct);

    public Task SendLowStockAlertAsync(string toEmail, IReadOnlyList<LowStockItem> items, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = $"Low Stock Alert – {items.Count} item(s) need attention",
            HtmlBody = LowStockHtml(items),
        }, null, null, ct);

    public Task SendOverdueCreditReminderAsync(string toEmail, string customerName, decimal amount, int daysOverdue = 0, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = $"Payment Due: Rs. {amount:N2} Outstanding – Precision Parts",
            HtmlBody = OverdueCreditHtml(customerName, amount, daysOverdue),
        }, null, null, ct);

    public Task SendInvoiceReceiptAsync(string toEmail, string customerName, string invoiceRef, decimal total, byte[]? pdfAttachment = null, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = $"Your Precision Parts Invoice – {invoiceRef}",
            HtmlBody = InvoiceHtml(customerName, toEmail, invoiceRef, total),
        }, pdfAttachment, $"Invoice_{invoiceRef}.pdf", ct);

    public Task SendResetPasswordOtpAsync(string toEmail, string fullName, string otp, CancellationToken ct = default)
        => SendAsync(new AppEmailMessage
        {
            From = _fromEmail,
            To = toEmail,
            Subject = "Password Reset OTP – Precision Parts",
            HtmlBody = ResetPasswordOtpHtml(fullName, otp),
        }, null, null, ct);

    private static string WelcomeHtml(string name) => $@"
        <div style=""font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb"">
          <h2 style=""color:#1a1a1a;margin-top:0"">Welcome aboard, {name}! 👋</h2>
          <p style=""color:#4b5563"">Your Precision Parts account is ready. You can now browse thousands of industrial parts, track your orders and manage service appointments.</p>
          <a href=""https://precisionparts.app"" style=""display:inline-block;margin-top:16px;padding:12px 24px;background:#4d6172;color:#fff;border-radius:8px;text-decoration:none;font-weight:600"">Visit Your Dashboard</a>
          <hr style=""border:none;border-top:1px solid #f3f4f6;margin:32px 0"">
          <p style=""color:#9ca3af;font-size:12px;margin:0"">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>";

    private static string LowStockHtml(IReadOnlyList<LowStockItem> items)
    {
        var rows = string.Join("", items.Select(i => $@"
            <tr>
              <td style=""padding:8px 12px;border-bottom:1px solid #f3f4f6"">{i.Name}</td>
              <td style=""padding:8px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace"">{i.Sku}</td>
              <td style=""padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#ef4444;font-weight:600"">{i.Stock}</td>
              <td style=""padding:8px 12px;border-bottom:1px solid #f3f4f6"">{i.ReorderLevel}</td>
            </tr>"));

        return $@"
            <div style=""font-family:Inter,sans-serif;max-width:700px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb"">
              <h2 style=""color:#ef4444;margin-top:0"">⚠️ Low Stock Alert</h2>
              <p style=""color:#4b5563"">{items.Count} part(s) have fallen below their reorder threshold:</p>
              <table style=""width:100%;border-collapse:collapse;margin-top:16px"">
                <thead>
                  <tr style=""background:#f9fafb"">
                    <th style=""padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280"">Part</th>
                    <th style=""padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280"">SKU</th>
                    <th style=""padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280"">Current Stock</th>
                    <th style=""padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280"">Reorder Level</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </table>
              <a href=""https://precisionparts.app/admin/inventory"" style=""display:inline-block;margin-top:24px;padding:12px 24px;background:#4d6172;color:#fff;border-radius:8px;text-decoration:none;font-weight:600"">Manage Inventory</a>
              <hr style=""border:none;border-top:1px solid #f3f4f6;margin:32px 0"">
              <p style=""color:#9ca3af;font-size:12px;margin:0"">This alert was generated automatically by Precision Parts.</p>
            </div>";
    }

    private static string OverdueCreditHtml(string name, decimal amount, int daysOverdue = 0)
    {
        var overdueText = daysOverdue > 0 ? $"{daysOverdue} days overdue" : "overdue";
        return $@"
        <div style=""font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#ffffff;padding:0;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden"">

          <!-- Header -->
          <div style=""background:linear-gradient(135deg,#dc2626,#f59e0b);padding:32px 40px"">
            <p style=""margin:0 0 4px;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase"">Precision Parts</p>
            <h1 style=""margin:0;color:#ffffff;font-size:24px;font-weight:700"">Payment Reminder</h1>
          </div>

          <!-- Body -->
          <div style=""padding:36px 40px"">
            <p style=""margin:0 0 24px;color:#374151;font-size:16px"">Dear <strong>{name}</strong>,</p>
            <p style=""margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6"">
              Your account has an outstanding balance that is <strong style=""color:#dc2626"">{overdueText}</strong>.
              Please settle the amount below at your earliest convenience to avoid service disruption.
            </p>

            <!-- Amount Box -->
            <div style=""background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;padding:28px 32px;text-align:center;margin-bottom:32px"">
              <p style=""margin:0 0 6px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px"">Total Outstanding Balance</p>
              <p style=""margin:0;font-size:42px;font-weight:800;color:#dc2626;letter-spacing:-1px"">Rs. {amount:N2}</p>
              {(daysOverdue > 0 ? $"<p style=\"margin:10px 0 0;color:#ef4444;font-size:14px;font-weight:600\">{daysOverdue} days past due</p>" : "")}
            </div>

            <!-- CTA -->
            <div style=""text-align:center;margin-bottom:28px"">
              <a href=""https://precisionparts.app/customer/payments"" style=""display:inline-block;padding:14px 36px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px"">Pay Now</a>
            </div>

            <p style=""margin:0;color:#9ca3af;font-size:13px;text-align:center"">
              If you have already made this payment, please ignore this reminder or contact us.
            </p>
          </div>

          <!-- Footer -->
          <div style=""background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6"">
            <p style=""margin:0;color:#9ca3af;font-size:12px"">Precision Parts Industrial Inventory &bull; Nepal &bull; This is an automated reminder.</p>
          </div>
        </div>";
    }

    private static string InvoiceHtml(string name, string email, string invoiceRef, decimal total) => $@"
        <div style=""font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb"">
          <h2 style=""color:#1a1a1a;margin-top:0"">Invoice Confirmation</h2>
          <p style=""color:#4b5563"">Dear {name} (<span style=""color:#4d6172"">{email}</span>), thank you for your purchase.</p>
          <div style=""background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0"">
            <p style=""margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase"">Invoice Reference</p>
            <p style=""margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#1a1a1a"">{invoiceRef}</p>
          </div>
          <div style=""background:#f9fafb;border-radius:8px;padding:20px"">
            <p style=""margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase"">Total Paid</p>
            <p style=""margin:0;font-size:24px;font-weight:800;color:#4d6172"">Rs. {total:N2}</p>
          </div>
          <a href=""https://precisionparts.app/account/orders"" style=""display:inline-block;margin-top:24px;padding:12px 24px;background:#4d6172;color:#fff;border-radius:8px;text-decoration:none;font-weight:600"">View Order History</a>
          <hr style=""border:none;border-top:1px solid #f3f4f6;margin:32px 0"">
          <p style=""color:#9ca3af;font-size:12px;margin:0"">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>";

    private static string ResetPasswordOtpHtml(string name, string otp) => $@"
        <div style=""font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;padding:40px;border-radius:12px;border:1px solid #e5e7eb"">
          <h2 style=""color:#1a1a1a;margin-top:0"">Password Reset Request</h2>
          <p style=""color:#4b5563"">Dear {name},</p>
          <p style=""color:#4b5563"">We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:</p>
          <div style=""background:#f9fafb;border-radius:8px;padding:24px;margin:24px 0;text-align:center"">
            <p style=""margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px"">Your Security Code</p>
            <p style=""margin:0;font-family:monospace;font-size:36px;font-weight:800;color:#4d6172;letter-spacing:8px"">{otp}</p>
          </div>
          <p style=""color:#ef4444;font-size:13px"">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          <hr style=""border:none;border-top:1px solid #f3f4f6;margin:32px 0"">
          <p style=""color:#9ca3af;font-size:12px;margin:0"">Precision Parts Industrial Inventory &bull; Nepal</p>
        </div>";
}
