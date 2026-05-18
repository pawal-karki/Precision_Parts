using CleanApp.Application.Email;
using CleanApp.Infrastructure.Jobs;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative endpoints for sending transactional and diagnostic emails
/// via the configured SMTP/Resend integration. Includes utilities for ad-hoc delivery,
/// integration testing, and manually triggering overdue credit reminder jobs.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/email")]
[Authorize(Roles = "Admin")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _email;
    private readonly ILogger<EmailController> _log;

    /// <summary>
    /// Initializes a new instance of <see cref="EmailController"/> with the required
    /// email service and logger.
    /// </summary>
    /// <param name="email">The service responsible for composing and dispatching emails.</param>
    /// <param name="log">The logger used to record delivery outcomes and errors.</param>
    public EmailController(IEmailService email, ILogger<EmailController> log)
    {
        _email = email;
        _log   = log;
    }

    // ── POST api/email/send ─────────────────────────────────────────────────

    /// <summary>
    /// Sends a one-off HTML email to a specified recipient.
    /// Intended as an administrative utility for direct transactional email dispatch.
    /// </summary>
    /// <param name="req">The email payload: recipient, subject, HTML body, and optional sender.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success; 400 Bad Request if required fields are missing;
    /// 502 Bad Gateway if the email delivery service returns an error.
    /// </returns>
    [HttpPost("send")]
    [ProducesResponseType(204)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Send([FromBody] SendEmailRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.To)      ||
            string.IsNullOrWhiteSpace(req.Subject) ||
            string.IsNullOrWhiteSpace(req.HtmlBody))
            return BadRequest("to, subject, and htmlBody are required.");

        try
        {
            await _email.SendAsync(new EmailMessage
            {
                From     = req.From ?? "Precision Parts <noreply@pawal.com.np>",
                To       = req.To,
                Subject  = req.Subject,
                HtmlBody = req.HtmlBody,
            }, ct: ct);

            return NoContent();
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Failed to send email");
            return StatusCode(502, "Email delivery failed.");
        }
    }

    // ── POST api/email/test ─────────────────────────────────────────────────

    /// <summary>
    /// Sends a predefined test email to the specified address to verify
    /// the Resend integration is correctly configured and operational.
    /// </summary>
    /// <param name="to">The recipient email address (query parameter).</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success; 400 Bad Request if <c>to</c> is missing;
    /// 502 Bad Gateway if delivery fails.
    /// </returns>
    [HttpPost("test")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Test([FromQuery] string to, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(to))
            return BadRequest("'to' query parameter is required.");

        try
        {
            await _email.SendAsync(new EmailMessage
            {
                From     = "Precision Parts <noreply@pawal.com.np>",
                To       = to,
                Subject  = "Resend integration is working!",
                HtmlBody = """
                    <div style="font-family:Inter,sans-serif;padding:40px;max-width:500px">
                      <h2>It works!</h2>
                      <p>Your Precision Parts backend is successfully sending emails via <strong>Resend</strong>.</p>
                    </div>
                    """,
            }, ct: ct);

            return NoContent();
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Test email failed");
            return StatusCode(502, "Test email delivery failed.");
        }
    }

    // ── POST api/email/trigger-overdue-reminders ────────────────────────────

    /// <summary>
    /// Enqueues the overdue credit reminder Hangfire job immediately,
    /// bypassing the scheduled cron trigger. Useful for on-demand dispatches or testing.
    /// </summary>
    /// <returns>202 Accepted with a message confirming the job was queued.</returns>
    [HttpPost("trigger-overdue-reminders")]
    [ProducesResponseType(202)]
    public IActionResult TriggerOverdueReminders()
    {
        BackgroundJob.Enqueue<OverdueCreditReminderJob>(j => j.ExecuteAsync());
        return Accepted(new { message = "Overdue credit reminder job queued. Check Hangfire dashboard for progress." });
    }

    // ── POST api/email/test-overdue-reminder ────────────────────────────────

    /// <summary>
    /// Directly sends a simulated overdue balance reminder email to the given address,
    /// bypassing Hangfire scheduling and throttle logic. Use this to verify SMTP
    /// delivery and template rendering without affecting real customer records.
    /// </summary>
    /// <param name="to">The recipient email address (required).</param>
    /// <param name="name">Customer display name in the reminder. Defaults to "Valued Customer".</param>
    /// <param name="amount">Simulated outstanding balance. Defaults to 14,125.</param>
    /// <param name="daysOverdue">Number of days the balance is overdue. Defaults to 47.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success; 400 Bad Request if <c>to</c> is missing;
    /// 502 Bad Gateway if delivery fails.
    /// </returns>
    [HttpPost("test-overdue-reminder")]
    [ProducesResponseType(204)]
    [ProducesResponseType(502)]
    public async Task<IActionResult> TestOverdueReminder(
        [FromQuery] string to,
        [FromQuery] string name = "Valued Customer",
        [FromQuery] decimal amount = 14125m,
        [FromQuery] int daysOverdue = 47,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(to))
            return BadRequest("'to' query parameter is required.");

        try
        {
            await _email.SendOverdueCreditReminderAsync(to, name, amount, daysOverdue, ct);
            _log.LogInformation("TestOverdueReminder: Sent overdue reminder to {To}.", to);
            return NoContent();
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "TestOverdueReminder: Failed to send to {To}.", to);
            return StatusCode(502, new { error = ex.Message });
        }
    }
}

/// <summary>
/// Represents the request payload for sending a one-off transactional email.
/// </summary>
/// <param name="From">
/// Optional sender address in "Name &lt;email&gt;" format.
/// Defaults to "Precision Parts &lt;noreply@pawal.com.np&gt;" if omitted.
/// </param>
/// <param name="To">The recipient email address. Required.</param>
/// <param name="Subject">The email subject line. Required.</param>
/// <param name="HtmlBody">The full HTML content of the email body. Required.</param>
public sealed record SendEmailRequest(
    string? From,
    string  To,
    string  Subject,
    string  HtmlBody
);
