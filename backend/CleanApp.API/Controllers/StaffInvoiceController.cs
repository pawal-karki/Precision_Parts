using CleanApp.Application.Demo;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/staff/invoice")]
public class StaffInvoiceController : ControllerBase
{
    private readonly IDemoContentProvider _demo;

    public StaffInvoiceController(IDemoContentProvider demo) => _demo = demo;

    [HttpGet]
    public IActionResult Get() => Ok(_demo.SampleInvoice);
}
      