using CleanApp.Application.Staff;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/part-requests")]
[Authorize(Roles = "Admin,Staff")]
public class StaffPartRequestsController : ControllerBase
{
    private readonly IPartRequestsStaffService _partRequests;

    public StaffPartRequestsController(IPartRequestsStaffService partRequests) => _partRequests = partRequests;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _partRequests.ListAsync(cancellationToken));

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdatePartRequestStatusDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _partRequests.UpdateStatusAsync(id, dto.Status, cancellationToken);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
