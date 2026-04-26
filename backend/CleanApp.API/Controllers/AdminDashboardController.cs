using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _dashboard;

    public AdminDashboardController(IAdminDashboardService dashboard) => _dashboard = dashboard;

    [HttpGet("kpis")]
    public async Task<IActionResult> Kpis(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetKpisAsync(cancellationToken));

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetRevenueSeriesAsync(cancellationToken));

    [HttpGet("distribution")]
    public async Task<IActionResult> Distribution(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetCategoryDistributionAsync(cancellationToken));

    [HttpGet("top-parts")]
    public async Task<IActionResult> TopParts(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetTopPartsAsync(cancellationToken));

    [HttpGet("alerts")]
    public async Task<IActionResult> Alerts(CancellationToken cancellationToken) =>
        Ok(await _dashboard.GetAlertsAsync(cancellationToken));

    [HttpGet("activity")]
    public IActionResult Activity() => Ok(_dashboard.GetActivity());

    [HttpGet("audit-log")]
    public IActionResult AuditLog() => Ok(_dashboard.GetAuditLog());

    [HttpPost("projection")]
    public async Task<IActionResult> UpdateProjection([FromBody] UpdateProjectionDto dto, CancellationToken cancellationToken)
    {
        await _dashboard.UpdateProjectionAsync(dto.Year, dto.Month, dto.Amount, cancellationToken);
        return Ok();
    }
}

public record UpdateProjectionDto(int Year, int Month, decimal Amount);
    