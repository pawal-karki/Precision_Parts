using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides customer-facing endpoints for retrieving POS invoices associated with
/// the authenticated customer's account, and for submitting invoice payments.
/// Restricted to the Customer role.
/// </summary>
[ApiController]
[Route("api/customer/invoices")]
[Authorize(Roles = "Customer")]
public class CustomerInvoicesController : ControllerBase
{
    private readonly ICustomerInvoiceService _invoices;

    /// <summary>
    /// Initializes a new instance of <see cref="CustomerInvoicesController"/>
    /// with the required invoice service.
    /// </summary>
    /// <param name="invoices">The service responsible for customer invoice operations.</param>
    public CustomerInvoicesController(ICustomerInvoiceService invoices) => _invoices = invoices;

    /// <summary>
    /// Retrieves all POS (Point of Sale) invoices associated with the currently
    /// authenticated customer, enabling them to review their purchase history.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the list of POS invoices for the current customer;
    /// 401 Unauthorized if the user identity cannot be resolved from the token.
    /// </returns>
    [HttpGet("pos")]
    public async Task<IActionResult> ListPos(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        return Ok(await _invoices.ListPosInvoicesAsync(userId, cancellationToken));
    }

    /// <summary>
    /// Submits a payment for a specific POS invoice identified by its GUID.
    /// Only the authenticated customer who owns the invoice may initiate payment.
    /// </summary>
    /// <param name="invoiceId">The unique identifier of the invoice to pay.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on successful payment;
    /// 401 Unauthorized if the user identity cannot be resolved;
    /// 404 Not Found if the invoice does not exist or does not belong to the current user;
    /// 400 Bad Request if the invoice has already been paid or another business rule is violated.
    /// </returns>
    [HttpPost("{invoiceId:guid}/pay")]
    public async Task<IActionResult> Pay(Guid invoiceId, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        try
        {
            await _invoices.PayInvoiceAsync(userId, invoiceId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
