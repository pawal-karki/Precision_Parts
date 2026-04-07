using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/financial")]
public class AdminFinancialController : ControllerBase
{
    private readonly IAdminFinancialService _financial;

    public AdminFinancialController(IAdminFinancialService financial) => _financial = financial;

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken cancellationToken) =>
        Ok(await _financial.GetSummaryAsync(cancellationToken));

    [HttpGet("profit-loss")]
    public async Task<IActionResult> ProfitLoss(CancellationToken cancellationToken) =>
        Ok(await _financial.GetProfitLossAsync(cancellationToken));

    [HttpGet("reports")]
    public IActionResult Reports() => Ok(_financial.GetReportRows());
}
    