using System.Globalization;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.CustomerPortal;

public class CustomerOrdersService : ICustomerOrdersService
{
    private readonly ICustomerRepository _customers;

    public CustomerOrdersService(ICustomerRepository customers)
    {
        _customers = customers;
    }

    public async Task<IReadOnlyList<CustomerOrderRow>> ListCustomerOrdersAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        // Get all activity data for the customer
        var (appointments, invoices, partRequests) = await _customers.GetActivityDataAsync(customerId, cancellationToken);

        var orders = new List<CustomerOrderRow>();

        // 1. Add Invoices as completed/billed orders
        foreach (var inv in invoices)
        {
            var itemsDesc = inv.Items.Any() 
                ? string.Join(", ", inv.Items.Select(x => $"{x.Description} ({x.ItemType})"))
                : "General Service / Parts";

            orders.Add(new CustomerOrderRow(
                inv.InvoiceNumber,
                inv.IssueDate.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                itemsDesc,
                DisplayMoney.Format(inv.TotalAmount),
                inv.Status == InvoiceStatus.Paid ? "Delivered" : "Processing"
            ));
        }

        // 2. Add PartRequests as active sourcing orders
        foreach (var pr in partRequests)
        {
            // Map PartRequest statuses to UI badge statuses
            var status = pr.Status switch
            {
                "Available" => "Delivered",
                "Cancelled" => "Returned",
                _ => "Processing" // Pending, Sourcing -> Processing
            };

            orders.Add(new CustomerOrderRow(
                $"PR-{pr.Id.ToString().Substring(0, 8).ToUpper()}",
                pr.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture),
                $"{pr.PartName} for {pr.VehicleModel}",
                "N/A", // Part requests might not have a total yet
                status
            ));
        }

        // Return ordered by date descending
        return orders
            .OrderByDescending(o => o.Date)
            .ToList();
    }
}
