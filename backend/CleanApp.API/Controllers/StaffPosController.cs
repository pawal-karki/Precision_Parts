using System.Security.Claims;
using CleanApp.Application.Staff;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/pos")]
[Authorize(Roles = "Admin,Staff")]
public class StaffPosController : ControllerBase
{
    private readonly IStaffPosService _pos;

    public StaffPosController(IStaffPosService pos) => _pos = pos;

    private static Guid? TryGetUserId(ClaimsPrincipal user)
    {
        var s = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return Guid.TryParse(s, out var g) ? g : null;
    }

    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken cancellationToken) =>
        Ok(await _pos.GetProductsAsync(cancellationToken));

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CreatePosSaleDto request, CancellationToken cancellationToken)
    {
        try
        {
            var actor = TryGetUserId(User);
            var result = await _pos.CheckoutAsync(request, actor, cancellationToken);
            return Ok(new { invoiceId = result.InvoiceId, invoiceNumber = result.InvoiceNumber });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> PosHistory([FromQuery] int take = 150, CancellationToken cancellationToken = default) =>
        Ok(await _pos.ListPosHistoryAsync(take, cancellationToken));

    [HttpGet("history/{invoiceId:guid}")]
    public async Task<IActionResult> PosHistoryDetail(Guid invoiceId, CancellationToken cancellationToken)
    {
        var dto = await _pos.GetPosSaleDetailAsync(invoiceId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }

    [HttpPut("history/{invoiceId:guid}")]
    public async Task<IActionResult> UpdatePosSale(Guid invoiceId, [FromBody] UpdateStaffPosSaleDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _pos.UpdatePosSaleAsync(invoiceId, dto, TryGetUserId(User), cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
