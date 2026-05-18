using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing dashboard endpoints exposing personalised summary data,
/// including account KPIs and a credit ledger view.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/dashboard")]
[Authorize(Roles = "Customer")]
public class CustomerDashboardController : ControllerBase
{
    private readonly ICustomerDashboardService _dashboard;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerDashboardController"/>
    /// with the required customer dashboard service.
    /// </summary>
    /// <param name="dashboard">The service responsible for aggregating customer dashboard data.</param>
    public CustomerDashboardController(ICustomerDashboardService dashboard) => _dashboard = dashboard;

    /// <summary>
    /// Retrieves the personalised dashboard data for the currently authenticated customer,
    /// including total purchases, loyalty tier, active vehicles, and upcoming appointments.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the customer's dashboard summary;
    /// 401 Unauthorized if the user identity cannot be resolved from the token;
    /// 404 Not Found if no dashboard data is available for the user.
    /// </returns>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var dto = await _dashboard.GetCustomerDashboardAsync(userId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }

    /// <summary>
    /// Retrieves the credit ledger for the currently authenticated customer,
    /// showing outstanding balances, payment history, and credit aging information.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the customer's credit ledger data;
    /// 401 Unauthorized if the user identity cannot be resolved from the token;
    /// 404 Not Found if no ledger data is available for the user.
    /// </returns>
    [HttpGet("ledger")]
    public async Task<IActionResult> GetLedger(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var dto = await _dashboard.GetCustomerLedgerAsync(userId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }
}