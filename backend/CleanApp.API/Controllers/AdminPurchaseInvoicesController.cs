using CleanApp.Application.Demo;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/admin/purchase-invoices")]
public class AdminPurchaseInvoicesController : ControllerBase
{
    private readonly IDemoContentProvider _demo;

    public AdminPurchaseInvoicesController(IDemoContentProvider demo) => _demo = demo;

    [HttpGet]
    public IActionResult List() => Ok(_demo.PurchaseInvoices);

    [HttpPost("{id}/approve")]
    public IActionResult Approve(string id)
    {
        _demo.ApproveInvoice(id);
        return Ok();
    }
}
           