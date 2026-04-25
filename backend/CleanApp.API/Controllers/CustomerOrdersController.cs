using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/orders")]
[Authorize(Roles = "Customer")]
public class CustomerOrdersController : ControllerBase
{
    private readonly ICustomerOrdersService _orders;

    public CustomerOrdersController(ICustomerOrdersService orders) => _orders = orders;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        return Ok(await _orders.ListCustomerOrdersAsync(userId, cancellationToken));
    }
}
