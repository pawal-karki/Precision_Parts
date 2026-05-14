using CleanApp.Domain.Entities;

namespace CleanApp.Application.Pdf;

public interface IPdfService
{
    byte[] GenerateInvoicePdf(Invoice invoice, string? customerName);
}
