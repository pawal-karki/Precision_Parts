using CleanApp.Application.Staff;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides staff-facing endpoints for viewing and managing customer part requests
/// (requests for parts not currently in stock). Supports listing all requests and
/// updating their processing status. Accessible by Admin and Staff roles.
/// </summary>
[ApiController]
[Route("api/staff/part-requests")]
[Authorize(Roles = "Admin,Staff")]
public class StaffPartRequestsController : ControllerBase
{
    private readonly IPartRequestsStaffService _partRequests;

    /// <summary>
    /// Initializes a new instance of <see cref="StaffPartRequestsController"/>
    /// with the required part requests service.
    /// </summary>
    /// <param name="partRequests">The service responsible for part request management logic.</param>
    public StaffPartRequestsController(IPartRequestsStaffService partRequests) => _partRequests = partRequests;

    /// <summary>
    /// Retrieves all customer part requests submitted through the customer portal,
    /// ordered by creation date for staff review and processing.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of all part requests.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _partRequests.ListAsync(cancellationToken));

    /// <summary>
    /// Updates the processing status of a customer part request (e.g., Pending → In Progress → Fulfilled).
    /// </summary>
    /// <param name="id">The unique identifier of the part request to update.</param>
    /// <param name="dto">The update payload containing the new status value.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 400 Bad Request if the provided status is invalid;
    /// 404 Not Found if no part request with the given ID exists.
    /// </returns>
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
