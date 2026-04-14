using CleanApp.Application.Staff;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/pos")]
public class StaffPosController : ControllerBase
{
    private readonly IStaffPosService _pos;

    public StaffPosController(IStaffPosService pos) => _pos = pos;

    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken cancellationToken) =>
        Ok(await _pos.GetProductsAsync(cancellationToken));
}
      