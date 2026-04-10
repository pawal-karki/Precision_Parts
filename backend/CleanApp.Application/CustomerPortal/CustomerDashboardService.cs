using System.Globalization;
using CleanApp.Domain.Repositories;

namespace CleanApp.Application.CustomerPortal;

public class CustomerDashboardService : ICustomerDashboardService
{
    private const string DemoCustomerEmail = "e.schmidt@email.de";

    private readonly ICustomerRepository _customers;
    private readonly IInvoiceRepository _invoices;

    public CustomerDashboardService(ICustomerRepository customers, IInvoiceRepository invoices)
    {
        _customers = customers;
        _invoices = invoices;
    }

    public async Task<CustomerDashboardDto?> GetDemoCustomerDashboardAsync(CancellationToken cancellationToken = default)
    {
        var user = await _customers.GetCustomerByEmailWithDetailsAsync(DemoCustomerEmail, cancellationToken);
        if (user?.CustomerProfile == null)
            return null;

        var p = user.CustomerProfile;
        var pending = p.OutstandingCredit > 0 ? p.OutstandingCredit : 0;
        var unpaid = await _invoices.CountForCustomerExcludingPaidAsync(user.Id, cancellationToken);

        var recent = await _invoices.ListByCustomerIdWithItemsAsync(user.Id, 3, cancellationToken);

        var activity = new List<CustomerActivityRow>();
        var aid = 1;
        foreach (var inv in recent)
        {
            activity.Add(new CustomerActivityRow(
                aid++,
                "Order",
                $"Invoice {inv.InvoiceNumber}",
                inv.IssueDate.ToString("MMM dd", CultureInfo.InvariantCulture),
                DisplayMoney.Format(inv.TotalAmount)));
        }

        activity.Add(new CustomerActivityRow(aid++, "Service", "Full brake inspection", "Feb 15", "$120.00"));

        var vehicles = user.Vehicles.Select(v => new CustomerVehicleRow(
            Math.Abs(v.Id.GetHashCode()) % 100000,
            v.Nickname ?? $"{v.Year} {v.Make} {v.Model}".Trim(),
            v.Vin ?? "",
            v.MileageKm.HasValue ? $"{v.MileageKm:N0} km" : "—",
            v.LastServiceDate?.ToString("yyyy-MM-dd") ?? "—",
            v.HealthScore ?? 0)).ToList();

        return new CustomerDashboardDto(
            DisplayMoney.Format(p.TotalSpent),
            DisplayMoney.Format(pending),
            unpaid > 0 ? unpaid : 2,
            (int)Math.Min(99999, p.TotalSpent * 0.28m),
            vehicles,
            activity);
    }
}
    