using CleanApp.Application.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/customers")]
[Authorize(Roles = "Admin,Staff")]
public class StaffCustomersController : ControllerBase
{
    private readonly ICustomersService _customers;

    public StaffCustomersController(ICustomersService customers) => _customers = customers;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _customers.ListForStaffAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerCreateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var publicId = await _customers.CreateAsync(dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { publicId });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{publicId:int}")]
    public async Task<IActionResult> Update(int publicId, [FromBody] CustomerUpdateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _customers.UpdateAsync(publicId, dto, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{publicId:int}")]
    public async Task<IActionResult> Delete(int publicId, CancellationToken cancellationToken)
    {
        try
        {
            await _customers.DeleteAsync(publicId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{publicId:int}/detailed-report")]
    public async Task<IActionResult> DetailedReport(int publicId, CancellationToken cancellationToken)
    {
        try
        {
            var report = await _customers.GetDetailedReportAsync(publicId, cancellationToken);
            return Ok(report);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{publicId:int}/activity")]
    public async Task<IActionResult> ActivityLog(
        int publicId,
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _customers.GetActivityLogAsync(publicId, page, size, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{publicId:int}/login-activity")]
    public async Task<IActionResult> LoginActivity(
        int publicId,
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _customers.GetLoginActivityAsync(publicId, page, size, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
                                            