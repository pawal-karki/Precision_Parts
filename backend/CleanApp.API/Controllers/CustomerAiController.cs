using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for AI-driven maintenance predictions
/// and trend analysis based on aggregated service data.
/// No authentication is required for these informational endpoints.
/// </summary>
[ApiController]
[Route("api/customer/ai")]
public class CustomerAiController : ControllerBase
{
    private readonly ICustomerAiService _ai;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerAiController"/>
    /// with the required AI service.
    /// </summary>
    /// <param name="ai">The service responsible for generating AI-based predictions and trend data.</param>
    public CustomerAiController(ICustomerAiService ai) => _ai = ai;

    /// <summary>
    /// Retrieves AI-generated maintenance predictions for the customer portal,
    /// such as likely upcoming service needs based on historical patterns.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of maintenance predictions.</returns>
    [HttpGet("predictions")]
    public async Task<IActionResult> Predictions(CancellationToken cancellationToken) =>
        Ok(await _ai.GetPredictionsAsync(cancellationToken));

    /// <summary>
    /// Retrieves a maintenance trend summary for display in the customer dashboard,
    /// such as average service intervals or common repair categories.
    /// </summary>
    /// <returns>A 200 OK response containing the maintenance trend data.</returns>
    [HttpGet("trends")]
    public IActionResult Trends() => Ok(_ai.GetMaintenanceTrend());
}
