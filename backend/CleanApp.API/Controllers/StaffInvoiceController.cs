using CleanApp.Application.Demo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

/// <summary>
/// Provides a staff-facing endpoint for retrieving a sample sales invoice
/// for display, printing, or template validation purposes.
/// Accessible by Admin and Staff roles.
/// </summary>
[ApiController]
[Route("api/staff/invoice")]
[Authorize(Roles = "Admin,Staff")]
public class StaffInvoiceController : ControllerBase
{
    private readonly IDemoContentProvider _demo;

    /// <summary>
    /// Initializes a new instance of <see cref="StaffInvoiceController"/>
    /// with the required demo content provider.
    /// </summary>
    /// <param name="demo">The provider supplying sample invoice data for display and testing.</param>
    public StaffInvoiceController(IDemoContentProvider demo) => _demo = demo;

    /// <summary>
    /// Retrieves a sample sales invoice for preview or template validation.
    /// Useful for testing the invoice rendering pipeline without generating a real transaction.
    /// </summary>
    /// <returns>A 200 OK response containing the sample invoice data.</returns>
    [HttpGet]
    public IActionResult Get() => Ok(_demo.SampleInvoice);
}