using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for viewing order history, checking loyalty programme
/// status, and placing new orders through the customer portal.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer")]
[Authorize(Roles = "Customer")]
public class CustomerOrdersController : ControllerBase
{
    private readonly ICustomerOrdersService _orders;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerOrdersController"/>
    /// with the required customer orders service.
    /// </summary>
    /// <param name="orders">The service responsible for customer order and loyalty logic.</param>
    public CustomerOrdersController(ICustomerOrdersService orders) => _orders = orders;

    /// <summary>
    /// Extracts the authenticated customer's GUID from their JWT claims.
    /// Returns <see cref="Guid.Empty"/> if the claim is absent or unparseable.
    /// </summary>
    private Guid GetUserId()
    {
        var str = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(str, out var id) ? id : Guid.Empty;
    }

    /// <summary>
    /// Retrieves the complete order history for the currently authenticated customer,
    /// including invoice details and line items for all past purchases.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the customer's order history;
    /// 401 Unauthorized if the user identity cannot be resolved.
    /// </returns>
    [HttpGet("orders")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        return Ok(await _orders.ListCustomerOrdersAsync(userId, cancellationToken));
    }

    /// <summary>
    /// Retrieves the current loyalty programme status for the authenticated customer,
    /// including total spend, discount eligibility, and tier information.
    /// A 10% discount is automatically applied to purchases exceeding the configured threshold.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the loyalty status data;
    /// 401 Unauthorized if the user identity cannot be resolved;
    /// 404 Not Found if the customer does not have a loyalty profile.
    /// </returns>
    [HttpGet("loyalty")]
    public async Task<IActionResult> GetLoyalty(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();
        var dto = await _orders.GetLoyaltyStatusAsync(userId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }

    /// <summary>
    /// Places a new order on behalf of the authenticated customer through the customer portal.
    /// Applies applicable loyalty discounts before generating the invoice.
    /// </summary>
    /// <param name="dto">The order payload containing selected parts and quantities.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the generated invoice number on success;
    /// 401 Unauthorized if the user identity cannot be resolved;
    /// 404 Not Found if a referenced part or resource does not exist;
    /// 400 Bad Request for any other business rule violation (e.g., insufficient stock).
    /// </returns>
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
