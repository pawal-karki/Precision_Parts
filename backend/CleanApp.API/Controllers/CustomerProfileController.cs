using System.Security.Claims;
using CleanApp.Application.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[Authorize]
[ApiController]
[Route("api/customer/profile")]
public class CustomerProfileController : ControllerBase
{
    private readonly ICustomersService _customers;

    public CustomerProfileController(ICustomersService customers) => _customers = customers;

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] ProfileUpdateDto dto, CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (sub is null || !Guid.TryParse(sub, out var userId))
            return Unauthorized();

        await _customers.UpdateProfileAsync(userId, dto, ct);
        return Ok(new { message = "Profile updated successfully" });
    }
}
