using CleanApp.Domain.Entities;
using CleanApp.Domain.Enums;
using CleanApp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CleanApp.Infrastructure.Persistence.Repositories;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly AppDbContext _db;

    public InvoiceRepository(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<Invoice>> ListPaidAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.Status == InvoiceStatus.Paid)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<Invoice>> ListByIssueDateFromAsync(DateOnly fromInclusive, CancellationToken cancellationToken = default)
    {
        var list = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.IssueDate >= fromInclusive)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<Invoice>> ListPaidByIssueDateFromAsync(DateOnly fromInclusive, CancellationToken cancellationToken = default)
    {
        var list = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.IssueDate >= fromInclusive && i.Status == InvoiceStatus.Paid)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<Invoice>> ListByCustomerIdWithItemsAsync(Guid customerId, int take, CancellationToken cancellationToken = default)
    {
        var list = await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.IssueDate)
            .Take(take)
            .ToListAsync(cancellationToken);
        return list;
    }

    public Task<int> CountForCustomerExcludingPaidAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        _db.Invoices.CountAsync(i => i.CustomerId == customerId && i.Status != InvoiceStatus.Paid, cancellationToken);
}
       