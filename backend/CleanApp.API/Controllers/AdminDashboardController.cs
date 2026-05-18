using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative dashboard endpoints exposing high-level business intelligence data,
/// including KPIs, revenue trends, category distribution, top-performing parts,
/// system alerts, activity feeds, audit logs, and monthly projection management.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _dashboard;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminDashboardController"/> with the required dashboard service.
    /// </summary>
    /// <param name="dashboard">The service responsible for aggregating and serving dashboard data.</param>
    public AdminDashboardController(IAdminDashboardService dashboard) => _dashboard = dashboard;

    /// <summary>
    /// Retrieves the core Key Performance Indicators (KPIs) for the admin dashboard,
    /// such as total revenue, orders, active customers, and low-stock alerts.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the current KPI snapshot.</returns>
    [HttpGet("kpis")]
    public async Task<IActionResult> Kpis(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetKpisAsync(cancellationToken));

    /// <summary>
    /// Retrieves the time-series revenue data used to render the revenue trend chart
    /// on the admin dashboard.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the revenue series data points.</returns>
    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetRevenueSeriesAsync(cancellationToken));

    /// <summary>
    /// Retrieves the sales distribution breakdown by part category,
    /// used to render pie or donut charts on the admin dashboard.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the category distribution data.</returns>
    [HttpGet("distribution")]
    public async Task<IActionResult> Distribution(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetCategoryDistributionAsync(cancellationToken));

    /// <summary>
    /// Retrieves the top-selling parts ranked by total units sold or revenue generated.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the ranked list of top-performing parts.</returns>
    [HttpGet("top-parts")]
    public async Task<IActionResult> TopParts(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetTopPartsAsync(cancellationToken));

    /// <summary>
    /// Retrieves active system alerts, such as low-stock warnings and overdue customer credits,
    /// for display in the admin notification panel.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of current system alerts.</returns>
    [HttpGet("alerts")]
    public async Task<IActionResult> Alerts(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetAlertsAsync(cancellationToken));

    /// <summary>
    /// Retrieves the recent activity feed summarising the latest system events
    /// (e.g., sales, registrations, appointments) for the admin activity log widget.
    /// </summary>
    /// <returns>A 200 OK response containing the recent activity entries.</returns>
    [HttpGet("activity")]
    public IActionResult Activity() => Ok(_dashboard.GetActivity());

    /// <summary>
    /// Retrieves the system audit log containing a chronological record of
    /// significant administrative and operational actions performed within the system.
    /// </summary>
    /// <returns>A 200 OK response containing the audit log entries.</returns>
    [HttpGet("audit-log")]
    public IActionResult AuditLog() => Ok(_dashboard.GetAuditLog());

    /// <summary>
    /// Creates or updates the monthly revenue projection for a given year and month.
    /// Used by admins to set financial forecast targets on the dashboard.
    /// </summary>
    /// <param name="dto">The projection data including year, month, and target amount.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response confirming the projection was saved.</returns>
    [HttpPost("projection")]
    public async Task<IActionResult> UpdateProjection([FromBody] UpdateProjectionDto dto, CancellationToken cancellationToken)
    {
        await _dashboard.UpdateProjectionAsync(dto.Year, dto.Month, dto.Amount, cancellationToken);
        return Ok();
    }
}

/// <summary>
/// Represents the request payload for creating or updating a monthly revenue projection.
/// </summary>
/// <param name="Year">The calendar year of the projection (e.g., 2026).</param>
/// <param name="Month">The calendar month of the projection (1–12).</param>
/// <param name="Amount">The target projected revenue amount for the specified month.</param>
public record UpdateProjectionDto(int Year, int Month, decimal Amount);