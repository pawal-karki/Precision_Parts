using CleanApp.Application.Parts;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/parts")]
public class AdminPartsController : ControllerBase
{
    private readonly IPartsService _parts;

    public AdminPartsController(IPartsService parts) => _parts = parts;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _parts.ListForAdminAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PartCreateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var id = await _parts.CreateAsync(dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { id });
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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PartUpdateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _parts.UpdateAsync(id, dto, cancellationToken);
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
            await _parts.DeleteAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
      