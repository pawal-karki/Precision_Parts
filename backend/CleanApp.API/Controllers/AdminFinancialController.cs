using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative endpoints for accessing financial reporting data,
/// including overall financial summaries, profit and loss statements, and detailed financial reports.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/financial")]
[Authorize(Roles = "Admin")]
public class AdminFinancialController : ControllerBase
{
    private readonly IAdminFinancialService _financial;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminFinancialController"/> with the required financial service.
    /// </summary>
    /// <param name="financial">The service responsible for aggregating and serving financial data.</param>
    public AdminFinancialController(IAdminFinancialService financial) => _financial = financial;

    /// <summary>
    /// Retrieves a high-level financial summary including total revenue, expenses, and net profit
    /// for the current reporting period.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the financial summary data.</returns>
    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken cancellationToken) =>
        Ok(await _financial.GetSummaryAsync(cancellationToken));

    /// <summary>
    /// Retrieves the profit and loss (P&amp;L) statement comparing revenue against
    /// the cost of goods sold and operational expenses.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the profit and loss breakdown.</returns>
    [HttpGet("profit-loss")]
    public async Task<IActionResult> ProfitLoss(CancellationToken cancellationToken) =>
        Ok(await _financial.GetProfitLossAsync(cancellationToken));

    /// <summary>
    /// Retrieves the full set of financial reports, including daily, monthly, and yearly
    /// aggregates suitable for export or display in the admin reporting module.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the complete financial reports collection.</returns>
    [HttpGet("reports")]
    public async Task<IActionResult> Reports([FromQuery] string type = "monthly", [FromQuery] DateTime? date = null, CancellationToken cancellationToken = default) =>
        Ok(await _financial.GetFinancialReportsAsync(type, date, cancellationToken));
}