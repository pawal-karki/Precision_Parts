using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides a lightweight health check endpoint for verifying that the
/// Precision Parts API is running and reachable. Intended for use by
/// load balancers, monitoring systems, and deployment pipelines.
/// No authentication is required.
/// </summary>
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Returns a simple status response indicating the API is operational.
    /// </summary>
    /// <returns>A 200 OK response containing the service status and name.</returns>
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "Precision Parts API" });
}
