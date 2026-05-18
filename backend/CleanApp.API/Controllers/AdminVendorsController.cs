using CleanApp.Application.Vendors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides CRUD endpoints for managing vendor records within the Precision Parts system.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/vendors")]
[Authorize(Roles = "Admin")]
public class AdminVendorsController : ControllerBase
{
    private readonly IVendorsService _vendors;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminVendorsController"/> with the required vendor service.
    /// </summary>
    /// <param name="vendors">The service responsible for vendor management logic.</param>
    public AdminVendorsController(IVendorsService vendors) => _vendors = vendors;

    /// <summary>
    /// Retrieves the complete list of vendors registered in the system.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of all vendors.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _vendors.ListForAdminAsync(cancellationToken));

    /// <summary>
    /// Registers a new vendor in the system.
    /// </summary>
    /// <param name="dto">The data transfer object containing vendor registration details.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 201 Created with the new vendor's ID on success;
    /// 400 Bad Request if the provided data is invalid.
    /// </returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] VendorCreateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var id = await _vendors.CreateAsync(dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { id });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing vendor record identified by its unique GUID.
    /// </summary>
    /// <param name="id">The unique identifier of the vendor to update.</param>
    /// <param name="dto">The data transfer object containing the updated vendor details.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the vendor does not exist.
    /// </returns>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] VendorUpdateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _vendors.UpdateAsync(id, dto, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Permanently removes a vendor record from the system by its unique GUID.
    /// </summary>
    /// <param name="id">The unique identifier of the vendor to delete.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the vendor does not exist.
    /// </returns>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await _vendors.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}