using CleanApp.Application.Email;
using CleanApp.Infrastructure.Jobs;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>Admin-only endpoint for sending transactional emails via Resend.</summary>
[ApiController]
[Route("api/email")]
[Authorize(Roles = "Admin")]
public class EmailController : ControllerBase
{
    
    private readonly IEmailService _email;
    private readonly ILogger<EmailController> _log;
    public EmailController(IEmailService email, ILogger<EmailController> log)
    {
        _email = email;
        _log   = log;
    }
    // ── POST api/email/send ─────────────────────────────────────────────────
    /// <summary>Send a one-off HTML email (admin utility).</summary>
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
    /// <summary>Send a test email to verify the Resend integration is working.</summary>
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
    /// <summary>Immediately fires the overdue credit reminder job (admin utility / testing).</summary>
    [HttpPost("trigger-overdue-reminders")]
    [ProducesResponseType(202)]
    public IActionResult TriggerOverdueReminders()
    {
        BackgroundJob.Enqueue<OverdueCreditReminderJob>(j => j.ExecuteAsync());
        return Accepted(new { message = "Overdue credit reminder job queued. Check Hangfire dashboard for progress." });
    }

    // ── POST api/email/test-overdue-reminder ────────────────────────────────
    /// <summary>
    /// Directly sends an overdue balance reminder email to the given address —
    /// bypasses all job/throttle logic. Use this to verify SMTP delivery works.
    /// </summary>
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

public sealed record SendEmailRequest(
    string? From,
    string  To,
    string  Subject,
    string  HtmlBody
);
