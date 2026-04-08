using System.Globalization;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.CustomerPortal;

public class CustomerOrdersService : ICustomerOrdersService
{
    private const string DemoCustomerEmail = "e.schmidt@email.de";

    private readonly IUserRepository _users;
    private readonly IInvoiceRepository _invoices;

    public CustomerOrdersService(IUserRepository users, IInvoiceRepository invoices)
    {
        _users = users;
        _invoices = invoices;
    }

    public async Task<IReadOnlyList<CustomerOrderRow>> ListDemoCustomerOrdersAsync(CancellationToken cancellationToken = default)
    {
        var user = await _users.GetByEmailAsync(DemoCustomerEmail, cancellationToken);
        if (user == null)
            return Array.Empty<CustomerOrderRow>();

        var invs = await _invoices.ListByCustomerIdWithItemsAsync(user.Id, 20, cancellationToken);

        return invs.Select(i =>
        {
            var desc = i.Items.FirstOrDefault()?.Description ?? "Order";
            var status = i.Status switch
            {
                InvoiceStatus.Paid => "Delivered",
                InvoiceStatus.Unpaid => "Processing",
                InvoiceStatus.Partial => "Processing",
                InvoiceStatus.Overdue => "Processing",
                _ => "Delivered"
            };
            return new CustomerOrderRow(
                i.InvoiceNumber,
                i.IssueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                desc,
                DisplayMoney.Format(i.TotalAmount),
                status);
        }).ToList();
    }
}
