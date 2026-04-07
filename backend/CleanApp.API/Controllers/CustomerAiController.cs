using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/ai")]
public class CustomerAiController : ControllerBase
{
    private readonly ICustomerAiService _ai;

    public CustomerAiController(ICustomerAiService ai) => _ai = ai;

    [HttpGet("predictions")]
    public async Task<IActionResult> Predictions(CancellationToken cancellationToken) =>
        Ok(await _ai.GetPredictionsAsync(cancellationToken));

    [HttpGet("trends")]
    public IActionResult Trends() => Ok(_ai.GetMaintenanceTrend());
}
