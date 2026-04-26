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

    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken cancellationToken) =>
        Ok(await _pos.GetProductsAsync(cancellationToken));

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CreatePosSaleDto request, CancellationToken cancellationToken) =>
        Ok(new { InvoiceId = await _pos.CheckoutAsync(request, cancellationToken) });
}
      