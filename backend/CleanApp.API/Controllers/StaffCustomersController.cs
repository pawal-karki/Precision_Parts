using CleanApp.Application.Customers;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/customers")]
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
}
                                            