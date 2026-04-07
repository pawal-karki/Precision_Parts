using CleanApp.Application.Vendors;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/vendors")]
public class AdminVendorsController : ControllerBase
{
    private readonly IVendorsService _vendors;

    public AdminVendorsController(IVendorsService vendors) => _vendors = vendors;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _vendors.ListForAdminAsync(cancellationToken));

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
      