using CleanApp.Application.Admin;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/staff")]
public class AdminStaffController : ControllerBase
{
    private readonly IAdminStaffService _staff;

    public AdminStaffController(IAdminStaffService staff) => _staff = staff;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await _staff.ListAsync(ct));

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

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] StaffUpdateDto dto, CancellationToken ct)
    {
        try { await _staff.UpdateAsync(id, dto, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        try { await _staff.DeleteAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
   