using CleanApp.Application.CustomerPortal;
using Microsoft.AspNetCore.Mvc;

namespace CleanApp.API.Controllers;

[ApiController]
[Route("api/customer/orders")]
public class CustomerOrdersController : ControllerBase
{
    private readonly ICustomerOrdersService _orders;

    public CustomerOrdersController(ICustomerOrdersService orders) => _orders = orders;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken) =>
        Ok(await _orders.ListDemoCustomerOrdersAsync(cancellationToken));
}
