using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides an administrative endpoint for accessing inventory health reports,
/// including stock levels, low-stock indicators, and reorder recommendations.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/inventory")]
[Authorize(Roles = "Admin")]
public class AdminInventoryReportsController : ControllerBase
{
    private readonly IAdminInventoryReportsService _reports;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminInventoryReportsController"/>
    /// with the required inventory reports service.
    /// </summary>
    /// <param name="reports">The service responsible for generating inventory report data.</param>
    public AdminInventoryReportsController(IAdminInventoryReportsService reports) => _reports = reports;

    /// <summary>
    /// Retrieves the comprehensive inventory report containing stock quantities,
    /// low-stock flags (below threshold of 10 units), and restock recommendations
    /// for all parts in the system.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the full inventory report data.</returns>
    [HttpGet("reports")]
    public async Task<IActionResult> Reports(CancellationToken cancellationToken) =>
        Ok(await _reports.GetReportsAsync(cancellationToken));
}