using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/dashboard")]
[Authorize(Roles = "Customer")]
public class CustomerDashboardController : ControllerBase
{
    private readonly ICustomerDashboardService _dashboard;

    public CustomerDashboardController(ICustomerDashboardService dashboard) => _dashboard = dashboard;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var dto = await _dashboard.GetCustomerDashboardAsync(userId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }

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
      