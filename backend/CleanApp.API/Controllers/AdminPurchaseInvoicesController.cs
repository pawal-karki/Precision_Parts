using System.Collections.Generic;
using CleanApp.Application.Demo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides administrative endpoints for managing purchase invoices used to update stock levels.
/// Supports listing all purchase invoices and approving individual invoices to trigger inventory updates.
/// All operations are restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/admin/purchase-invoices")]
[Authorize(Roles = "Admin")]
public class AdminPurchaseInvoicesController : ControllerBase
{
    private readonly IDemoContentProvider _demo;

    /// <summary>
    /// Initializes a new instance of <see cref="AdminPurchaseInvoicesController"/>
    /// with the required demo content provider.
    /// </summary>
    /// <param name="demo">The provider supplying purchase invoice demo data and approval logic.</param>
    public AdminPurchaseInvoicesController(IDemoContentProvider demo) => _demo = demo;

    /// <summary>
    /// Retrieves the list of all purchase invoices available for review and approval.
    /// </summary>
    /// <returns>A 200 OK response containing the collection of purchase invoices.</returns>
    [HttpGet]
    public IActionResult List() => Ok(_demo.PurchaseInvoices);

    public record CreatePurchaseInvoiceDto(
        string Id, 
        string Vendor, 
        string Date, 
        double Subtotal, 
        double Tax, 
        double Total, 
        List<PurchaseInvoiceItemDto> Items);

    [HttpPost]
    public IActionResult Create([FromBody] CreatePurchaseInvoiceDto dto)
    {
        _demo.AddInvoice(dto.Id, dto.Vendor, dto.Date, "Pending", dto.Subtotal, dto.Tax, dto.Total, dto.Items);
        return Ok();
    }

    /// <summary>
    /// Approves a purchase invoice by its identifier, triggering the corresponding
    /// stock quantity update for the associated parts.
    /// </summary>
    /// <param name="id">The unique string identifier of the purchase invoice to approve.</param>
    /// <returns>A 200 OK response confirming the invoice has been approved.</returns>
    [HttpPost("{id}/approve")]
    public IActionResult Approve(string id)
    {
        _demo.ApproveInvoice(id);
        return Ok();
    }
}