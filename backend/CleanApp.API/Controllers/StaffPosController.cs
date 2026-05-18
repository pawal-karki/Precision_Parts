using System.Security.Claims;
using CleanApp.Application.Staff;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides staff-facing Point of Sale (POS) endpoints for processing customer sales transactions,
/// browsing the product catalogue, and managing POS sale history and corrections.
/// Accessible by Admin and Staff roles.
/// </summary>
[ApiController]
[Route("api/staff/pos")]
[Authorize(Roles = "Admin,Staff")]
public class StaffPosController : ControllerBase
{
    private readonly IStaffPosService _pos;

    /// <summary>
    /// Initializes a new instance of <see cref="StaffPosController"/>
    /// with the required POS service.
    /// </summary>
    /// <param name="pos">The service responsible for POS transaction logic.</param>
    public StaffPosController(IStaffPosService pos) => _pos = pos;

    /// <summary>
    /// Extracts the authenticated user's GUID from their JWT claims.
    /// Returns <c>null</c> if the claim is absent or cannot be parsed.
    /// </summary>
    private static Guid? TryGetUserId(ClaimsPrincipal user)
    {
        var s = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return Guid.TryParse(s, out var g) ? g : null;
    }

    /// <summary>
    /// Retrieves the full list of available products for the POS terminal,
    /// including current stock levels and pricing information.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the product catalogue.</returns>
    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken cancellationToken) =>
        Ok(await _pos.GetProductsAsync(cancellationToken));

    /// <summary>
    /// Processes a POS checkout transaction for a customer, deducting stock and generating
    /// a sales invoice. Automatically applies the loyalty discount (10%) if the total
    /// purchase value exceeds the configured threshold.
    /// The acting staff member's identity is captured from the JWT for audit purposes.
    /// </summary>
    /// <param name="request">The checkout payload containing customer ID, selected items, and quantities.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the generated invoice ID and invoice number on success;
    /// 400 Bad Request if the request contains invalid data (e.g., insufficient stock).
    /// </returns>
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

    /// <summary>
    /// Retrieves the most recent POS sales history records for display in the staff dashboard.
    /// </summary>
    /// <param name="take">The maximum number of recent records to return. Defaults to 150.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of recent POS transactions.</returns>
    [HttpGet("history")]
    public async Task<IActionResult> PosHistory([FromQuery] int take = 150, CancellationToken cancellationToken = default) =>
        Ok(await _pos.ListPosHistoryAsync(take, cancellationToken));

    /// <summary>
    /// Retrieves the full detail of a single POS sale transaction identified by its invoice GUID.
    /// </summary>
    /// <param name="invoiceId">The unique identifier of the POS invoice.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the detailed POS sale record;
    /// 404 Not Found if no matching invoice exists.
    /// </returns>
    [HttpGet("history/{invoiceId:guid}")]
    public async Task<IActionResult> PosHistoryDetail(Guid invoiceId, CancellationToken cancellationToken)
    {
        var dto = await _pos.GetPosSaleDetailAsync(invoiceId, cancellationToken);
        return dto == null ? NotFound() : Ok(dto);
    }

    /// <summary>
    /// Updates an existing POS sale record, such as correcting staff notes or adjusting
    /// payment status. The acting staff member's identity is captured from the JWT.
    /// </summary>
    /// <param name="invoiceId">The unique identifier of the POS invoice to update.</param>
    /// <param name="dto">The update payload containing the fields to modify.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the invoice does not exist;
    /// 400 Bad Request if the update data or business rules are violated.
    /// </returns>
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
