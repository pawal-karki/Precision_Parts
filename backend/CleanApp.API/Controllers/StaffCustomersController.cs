using CleanApp.Application.Customers;
using CleanApp.Application.Staff;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides staff-facing endpoints for managing customer accounts, including
/// registration, profile updates, deletion, and retrieval of detailed customer
/// reports, activity logs, login history, service history, and purchase records.
/// Accessible by Admin and Staff roles.
/// </summary>
[ApiController]
[Route("api/staff/customers")]
[Authorize(Roles = "Admin,Staff")]
public class StaffCustomersController : ControllerBase
{
    private readonly ICustomersService _customers;
    private readonly IInvoiceReceiptEmailQueue _receiptEmailQueue;

    public StaffCustomersController(ICustomersService customers, IInvoiceReceiptEmailQueue receiptEmailQueue)
    {
        _customers = customers;
        _receiptEmailQueue = receiptEmailQueue;
    }

    /// <summary>
    /// Retrieves the complete list of customers with their profile summaries.
    /// </summary>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>A 200 OK response containing the list of all customers.</returns>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _customers.ListForStaffAsync(cancellationToken));

    /// <summary>
    /// Registers a new customer account with the provided personal and vehicle details.
    /// </summary>
    /// <param name="dto">The data transfer object containing the new customer's information.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 201 Created with the new customer's public ID on success;
    /// 400 Bad Request if validation fails;
    /// 409 Conflict if a customer with the same email already exists.
    /// </returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerCreateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var publicId = await _customers.CreateAsync(dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, new { publicId });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Updates an existing customer's profile information identified by their public numeric ID.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer to update.</param>
    /// <param name="dto">The data transfer object containing the updated customer details.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpPut("{publicId:int}")]
    public async Task<IActionResult> Update(int publicId, [FromBody] CustomerUpdateDto dto, CancellationToken cancellationToken)
    {
        try
        {
            await _customers.UpdateAsync(publicId, dto, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Permanently removes a customer account from the system by their public numeric ID.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer to delete.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 204 No Content on success;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpDelete("{publicId:int}")]
    public async Task<IActionResult> Delete(int publicId, CancellationToken cancellationToken)
    {
        try
        {
            await _customers.DeleteAsync(publicId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Retrieves a comprehensive report for a specific customer, including purchase totals,
    /// loyalty status, credit balance, vehicle details, and appointment history.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the detailed customer report on success;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpGet("{publicId:int}/detailed-report")]
    public async Task<IActionResult> DetailedReport(int publicId, CancellationToken cancellationToken)
    {
        try
        {
            var report = await _customers.GetDetailedReportAsync(publicId, cancellationToken);
            return Ok(report);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Retrieves a paginated activity log for a specific customer, showing recent
    /// purchases, appointments, and other system interactions.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer.</param>
    /// <param name="page">The page number to retrieve (1-indexed). Defaults to 1.</param>
    /// <param name="size">The number of records per page. Defaults to 10.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a paginated list of activity entries;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpGet("{publicId:int}/activity")]
    public async Task<IActionResult> ActivityLog(
        int publicId,
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _customers.GetActivityLogAsync(publicId, page, size, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Retrieves a paginated login audit trail for a specific customer,
    /// showing IP addresses, user agents, and timestamps of past login sessions.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer.</param>
    /// <param name="page">The page number to retrieve (1-indexed). Defaults to 1.</param>
    /// <param name="size">The number of records per page. Defaults to 10.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with a paginated list of login audit entries;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpGet("{publicId:int}/login-activity")]
    public async Task<IActionResult> LoginActivity(
        int publicId,
        [FromQuery] int page = 1,
        [FromQuery] int size = 10,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _customers.GetLoginActivityAsync(publicId, page, size, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Retrieves the service history for a specific customer, including all past
    /// workshop appointments and completed service records.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the service history collection;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpGet("{publicId:int}/service-history")]
    public async Task<IActionResult> ServiceHistory(int publicId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _customers.GetServiceHistoryAsync(publicId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Retrieves the complete purchase history for a specific customer, including
    /// all POS sales invoices and associated line items.
    /// </summary>
    /// <param name="publicId">The public numeric identifier of the customer.</param>
    /// <param name="cancellationToken">Token to observe for cancellation requests.</param>
    /// <returns>
    /// 200 OK with the purchase history collection;
    /// 404 Not Found if the customer does not exist.
    /// </returns>
    [HttpGet("{publicId:int}/purchases")]
    public async Task<IActionResult> Purchases(int publicId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _customers.GetPurchasesAsync(publicId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Enqueues an email job to send the invoice receipt PDF to the customer.
    /// </summary>
    /// <param name="invoiceId">The unique identifier of the invoice.</param>
    /// <returns>202 Accepted on success.</returns>
    [HttpPost("invoices/{invoiceId:guid}/send-email")]
    public IActionResult SendInvoiceEmail(Guid invoiceId)
    {
        _receiptEmailQueue.Enqueue(invoiceId);
        return Accepted();
    }
}