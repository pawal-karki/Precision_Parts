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

    public async Task<IReadOnlyList<Invoice>> ListPaidWithItemsAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => i.Status == InvoiceStatus.Paid)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<Invoice>> ListByIssueDateFromAsync(DateTime fromInclusive, CancellationToken cancellationToken = default)
    {
        var list = await _db.Invoices
            .AsNoTracking()
            .Where(i => i.IssueDate >= fromInclusive)
            .ToListAsync(cancellationToken);
        return list;
    }

    public async Task<IReadOnlyList<Invoice>> ListPaidByIssueDateFromAsync(DateTime fromInclusive, CancellationToken cancellationToken = default)
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

    public async Task<IReadOnlyList<Invoice>> ListByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        return await _db.Invoices
            .AsNoTracking()
            .Where(i => i.CustomerId == customerId)
            .OrderByDescending(i => i.IssueDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<(decimal SumTotalAmount, decimal MaxSingleAmount)> GetCustomerSpendAggregatesAsync(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Invoices.AsNoTracking().Where(i => i.CustomerId == customerId);
        if (!await query.AnyAsync(cancellationToken))
            return (0m, 0m);

        var sum = await query.SumAsync(i => i.TotalAmount, cancellationToken);
        var max = await query.MaxAsync(i => i.TotalAmount, cancellationToken);
        return (sum, max);
    }

    public Task<int> CountForCustomerExcludingPaidAsync(Guid customerId, CancellationToken cancellationToken = default) =>
        _db.Invoices.CountAsync(i => i.CustomerId == customerId && i.Status != InvoiceStatus.Paid, cancellationToken);

    public async Task<Invoice?> GetByIdAndCustomerIdForUpdateAsync(Guid invoiceId, Guid customerId, CancellationToken cancellationToken = default) =>
        await _db.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.CustomerId == customerId, cancellationToken);

    public async Task<IReadOnlyList<Invoice>> ListPosForStaffAsync(int take, CancellationToken cancellationToken = default) =>
        await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.CreatedBy)
            .Include(i => i.Items)
            .Where(i => i.InvoiceNumber.StartsWith("POS-"))
            .OrderByDescending(i => i.IssueDate)
            .Take(take)
            .ToListAsync(cancellationToken);

    public async Task<Invoice?> GetPosInvoiceByIdForUpdateAsync(Guid invoiceId, CancellationToken cancellationToken = default) =>
        await _db.Invoices
            .Include(i => i.Customer)
            .Include(i => i.CreatedBy)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.InvoiceNumber.StartsWith("POS-"), cancellationToken);

    public async Task<Invoice?> GetPosInvoiceByIdForDetailAsync(Guid invoiceId, CancellationToken cancellationToken = default) =>
        await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.CreatedBy)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.InvoiceNumber.StartsWith("POS-"), cancellationToken);

    public void Add(Invoice invoice) => _db.Invoices.Add(invoice);

    public void AddPayment(Payment payment) => _db.Payments.Add(payment);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _db.SaveChangesAsync(cancellationToken);
}