using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/dashboard")]
public class CustomerDashboardController : ControllerBase
{
    private readonly ICustomerDashboardService _dashboard;

    public CustomerDashboardController(ICustomerDashboardService dashboard) => _dashboard = dashboard;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var dto = await _dashboard.GetDemoCustomerDashboardAsync(cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }
}
      