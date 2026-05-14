using System.Security.Claims;
using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/invoices")]
[Authorize(Roles = "Customer")]
public class CustomerInvoicesController : ControllerBase
{
    private readonly ICustomerInvoiceService _invoices;

    public CustomerInvoicesController(ICustomerInvoiceService invoices) => _invoices = invoices;

    [HttpGet("pos")]
    public async Task<IActionResult> ListPos(CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        return Ok(await _invoices.ListPosInvoicesAsync(userId, cancellationToken));
    }

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
