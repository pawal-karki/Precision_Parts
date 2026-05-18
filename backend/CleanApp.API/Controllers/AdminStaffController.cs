using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative endpoints for managing staff accounts and their roles.
/// Supports listing, creating, updating, and removing staff members.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/staff")]
[Authorize(Roles = "Admin")]
public class AdminStaffController : ControllerBase
{
    private readonly IAdminStaffService _staff;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminStaffController"/> with the required staff management service.
    /// </summary>
    /// <param name="staff">The service responsible for staff administration logic.</param>
    public AdminStaffController(IAdminStaffService staff) => _staff = staff;

    /// <summary>
    /// Retrieves the list of all staff members, optionally filtered by a specific staff entity ID.
    /// </summary>
    /// <param name="id">
    /// Optional. When provided, filters the result to return only the staff member
    /// matching the specified entity ID.
    /// </param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the (filtered) list of staff members.</returns>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? id, CancellationToken ct)
    {
        var list = await _staff.ListAsync(ct);
        if (id.HasValue)
        {
            list = list.Where(s => s.EntityId == id.Value).ToList();
        }
        return Ok(list);
    }

    /// <summary>
    /// Registers a new staff member account with the specified role and details.
    /// </summary>
    /// <param name="dto">The data transfer object containing the new staff member's information.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 201 Created with the new staff member's ID on success;
    /// 400 Bad Request if the provided data fails validation;
    /// 409 Conflict if an account with the same email already exists.
    /// </returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] StaffCreateDto dto, CancellationToken ct)
    {
        try
        {
            var id = await _staff.CreateAsync(dto, ct);
            return StatusCode(StatusCodes.Status201Created, new { id });
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    /// <summary>
    /// Updates an existing staff member's details identified by their unique GUID.
    /// </summary>
    /// <param name="id">The unique identifier of the staff member to update.</param>
    /// <param name="dto">The data transfer object containing the updated staff details.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the staff member does not exist.
    /// </returns>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] StaffUpdateDto dto, CancellationToken ct)
    {
        try { await _staff.UpdateAsync(id, dto, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    /// <summary>
    /// Permanently removes a staff member account from the system by their unique GUID.
    /// </summary>
    /// <param name="id">The unique identifier of the staff member to delete.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the staff member does not exist.
    /// </returns>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _staff.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}