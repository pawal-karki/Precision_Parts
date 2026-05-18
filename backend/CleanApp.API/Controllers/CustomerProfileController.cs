using System.Security.Claims;
using CleanApp.Application.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides an endpoint for authenticated users to update their own profile information,
/// such as name, phone number, and address. Accessible by any authenticated role.
/// </summary>
[Authorize]
[ApiController]
[Route("api/customer/profile")]
public class CustomerProfileController : ControllerBase
{
    private readonly ICustomersService _customers;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerProfileController"/>
    /// with the required customer service.
    /// </summary>
    /// <param name="customers">The service responsible for customer profile operations.</param>
    public CustomerProfileController(ICustomersService customers) => _customers = customers;

    /// <summary>
    /// Updates the profile of the currently authenticated user.
    /// The user's identity is resolved from the JWT claims, ensuring users can only
    /// modify their own profile data.
    /// </summary>
    /// <param name="dto">The profile update payload containing the fields to modify.</param>
    /// <param name="ct">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a success message on successful update;
    /// 401 Unauthorized if the user identity cannot be resolved from the token.
    /// </returns>
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
