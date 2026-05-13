using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer")]
[Authorize(Roles = "Customer")]
public class CustomerOrdersController : ControllerBase
{
    private readonly ICustomerOrdersService _orders;

    public CustomerOrdersController(ICustomerOrdersService orders) => _orders = orders;

    private Guid GetUserId()
    {
        var str = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(str, out var id) ? id : Guid.Empty;
    }

    [HttpGet("orders")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        return Ok(await _orders.ListCustomerOrdersAsync(userId, cancellationToken));
    }

    [HttpGet("loyalty")]
    public async Task<IActionResult> GetLoyalty(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        var dto = await _orders.GetLoyaltyStatusAsync(userId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CreateCustomerOrderDto dto, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        try
        {
            var invoiceNumber = await _orders.PlaceOrderAsync(userId, dto, cancellationToken);
            return Ok(new { invoiceNumber });
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }
}
