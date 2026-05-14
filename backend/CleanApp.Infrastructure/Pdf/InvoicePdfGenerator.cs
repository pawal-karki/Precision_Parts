using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using CleanApp.Domain.Entities;
using CleanApp.Application.Pdf;

namespace CleanApp.Infrastructure.Pdf;

public class InvoicePdfGenerator : IPdfService
{
    static InvoicePdfGenerator()
    {
        // QuestPDF requires setting the license. 
        // For development/community use:
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateInvoicePdf(Invoice invoice, string? customerName)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Verdana));

                // Header
                page.Header().PaddingBottom(10).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Precision Parts").FontSize(16).SemiBold().FontColor("#2d3432");
                        col.Item().Text("Kathmandu, Nepal").FontSize(9).FontColor("#5a605e");
                        col.Item().Text("New Baneshwor, Kathmandu 44600").FontSize(9).FontColor("#5a605e");
                        col.Item().Text("accounts@precision-parts.com").FontSize(9).FontColor("#5a605e");
                    });

                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Text("INVOICE").FontSize(24).ExtraBold().FontColor("#4d6172");
                        col.Item().Text($"{invoice.InvoiceNumber}").FontSize(10).FontColor("#5e5e5e");
                    });
                });

                // Content
                page.Content().Column(col =>
                {
                    col.Item().PaddingVertical(5).LineHorizontal(1).LineColor("#ecefec");

                    // Billing Info & Dates
                    col.Item().PaddingVertical(10).Row(row =>
                    {
                        row.RelativeItem().Background("#f2f4f2").Padding(10).Column(c =>
                        {
                            c.Item().Text("BILL TO").FontSize(8).SemiBold().FontColor("#5a605e");
                            c.Item().Text(customerName ?? "Walk-in Customer").FontSize(12).Bold().FontColor("#2d3432");
                            if (invoice.Customer != null)
                            {
                                c.Item().Text(invoice.Customer.Email).FontSize(9).FontColor("#5a605e");
                            }
                        });

                        row.RelativeItem().AlignRight().PaddingVertical(10).Column(c =>
                        {
                            c.Item().Text($"Date: {invoice.IssueDate:yyyy-MM-dd}").FontSize(9).FontColor("#5a605e");
                            c.Item().Text($"Due: {invoice.IssueDate.AddDays(30):yyyy-MM-dd}").FontSize(9).FontColor("#5a605e");
                        });
                    });

                    col.Item().PaddingTop(15).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(5);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Item");
                            header.Cell().Element(CellStyle).AlignRight().Text("Qty");
                            header.Cell().Element(CellStyle).AlignRight().Text("Unit Price");
                            header.Cell().Element(CellStyle).AlignRight().Text("Total");

                            static IContainer CellStyle(IContainer container)
                            {
                                return container.Background("#f2f4f2").PaddingVertical(5).PaddingHorizontal(5).DefaultTextStyle(x => x.SemiBold().FontSize(8).FontColor("#5a605e"));
                            }
                        });

                        foreach (var item in invoice.Items)
                        {
                            table.Cell().Element(ItemStyle).Text(item.Description);
                            table.Cell().Element(ItemStyle).AlignRight().Text($"{item.Quantity}");
                            table.Cell().Element(ItemStyle).AlignRight().Text($"Rs. {item.UnitPrice:N2}");
                            table.Cell().Element(ItemStyle).AlignRight().Text($"Rs. {item.LineTotal:N2}");

                            static IContainer ItemStyle(IContainer container)
                            {
                                return container.BorderBottom(1).BorderColor("#ecefec").PaddingVertical(5).PaddingHorizontal(5).DefaultTextStyle(x => x.FontSize(9).FontColor("#2d3432"));
                            }
                        }
                    });

                    // Totals
                    col.Item().AlignRight().PaddingTop(15).Column(c =>
                    {
                        c.Item().Row(r => {
                            r.RelativeItem().Text("Subtotal").FontSize(9).FontColor("#5a605e");
                            r.ConstantItem(80).AlignRight().Text($"Rs. {invoice.Subtotal:N2}").FontSize(9).FontColor("#2d3432");
                        });

                        if (invoice.DiscountAmount > 0)
                        {
                            c.Item().Row(r => {
                                r.RelativeItem().Text("Loyalty Discount (10%)").FontSize(9).FontColor("#10b981");
                                r.ConstantItem(80).AlignRight().Text($"-Rs. {invoice.DiscountAmount:N2}").FontSize(9).FontColor("#10b981");
                            });
                        }

                        c.Item().Row(r => {
                            r.RelativeItem().Text("VAT (13%)").FontSize(9).FontColor("#5a605e");
                            r.ConstantItem(80).AlignRight().Text($"Rs. {invoice.TaxAmount:N2}").FontSize(9).FontColor("#2d3432");
                        });

                        c.Item().PaddingTop(5).LineHorizontal(1).LineColor("#ecefec");

                        c.Item().PaddingTop(5).Row(r => {
                            r.RelativeItem().Text("Total Due").FontSize(12).Bold().FontColor("#2d3432");
                            r.ConstantItem(80).AlignRight().Text($"Rs. {invoice.TotalAmount:N2}").FontSize(14).ExtraBold().FontColor("#2d3432");
                        });
                    });
                });

                // Footer
                page.Footer().PaddingTop(50).Column(f =>
                {
                    f.Item().AlignCenter().Text("Thank you for your business. Payment due within 30 days.").FontSize(8).FontColor("#969696");
                    f.Item().AlignCenter().Text("Precision Parts • Kathmandu, Nepal").FontSize(8).FontColor("#969696");
                });
            });
        });

        return document.GeneratePdf();
    }
}
