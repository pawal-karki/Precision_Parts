using CleanApp.Application.Demo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/invoice")]
[Authorize(Roles = "Admin,Staff")]
public class StaffInvoiceController : ControllerBase
{
    private readonly IDemoContentProvider _demo;

    public StaffInvoiceController(IDemoContentProvider demo) => _demo = demo;

    [HttpGet]
    public IActionResult Get() => Ok(_demo.SampleInvoice);
}
      