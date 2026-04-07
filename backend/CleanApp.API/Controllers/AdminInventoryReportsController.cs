using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/inventory")]
public class AdminInventoryReportsController : ControllerBase
{
    private readonly IAdminInventoryReportsService _reports;

    public AdminInventoryReportsController(IAdminInventoryReportsService reports) => _reports = reports;

    [HttpGet("reports")]
    public async Task<IActionResult> Reports(CancellationToken cancellationToken) =>
        Ok(await _reports.GetReportsAsync(cancellationToken));
}
       