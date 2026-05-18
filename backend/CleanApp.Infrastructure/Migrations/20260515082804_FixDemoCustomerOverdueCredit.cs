using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CleanApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixDemoCustomerOverdueCredit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "CustomerProfiles" AS cp
                SET "OutstandingCredit" = 12500,
                    "LastOrderDate" = (CURRENT_DATE - INTERVAL '45 days'),
                    "AccountStatus" = 'Credit Overdue'
                FROM "Users" AS u
                WHERE cp."UserId" = u."Id"
                  AND u."Role" = 3
                  AND (
                    LOWER(u."Email") IN (
                      'pawal.karkidholi@koshistjames.edu.np',
                      'pawal.karkidholi@gmai.com'
                    )
                    OR u."FullName" = 'Pawal Karki Dholi'
                  );
                """);

            migrationBuilder.Sql("""
                INSERT INTO "Invoices" (
                    "Id", "InvoiceNumber", "CustomerId", "IssueDate", "DueDate", "Status",
                    "Subtotal", "TaxAmount", "DiscountAmount", "TotalAmount", "BalanceDue",
                    "CreatedAtUtc", "UpdatedAtUtc"
                )
                SELECT
                    gen_random_uuid(),
                    'INV-OVERDUE-SEED-' || u."PublicId"::text,
                    u."Id",
                    (NOW() AT TIME ZONE 'utc') - INTERVAL '45 days',
                    (NOW() AT TIME ZONE 'utc') - INTERVAL '15 days',
                    4,
                    12500,
                    1625,
                    0,
                    14125,
                    14125,
                    NOW() AT TIME ZONE 'utc',
                    NOW() AT TIME ZONE 'utc'
                FROM "Users" AS u
                WHERE u."Role" = 3
                  AND (
                    LOWER(u."Email") IN (
                      'pawal.karkidholi@koshistjames.edu.np',
                      'pawal.karkidholi@gmai.com'
                    )
                    OR u."FullName" = 'Pawal Karki Dholi'
                  )
                  AND NOT EXISTS (
                    SELECT 1 FROM "Invoices" AS i
                    WHERE i."CustomerId" = u."Id"
                      AND i."Status" <> 3
                      AND i."BalanceDue" > 0
                  );
                """);

            migrationBuilder.Sql("""
                INSERT INTO "InvoiceItems" (
                    "Id", "InvoiceId", "ItemType", "Description", "Quantity", "UnitPrice", "LineTotal",
                    "CreatedAtUtc", "UpdatedAtUtc"
                )
                SELECT
                    gen_random_uuid(),
                    i."Id",
                    'part',
                    'Precision parts order — credit terms (45+ days outstanding)',
                    1,
                    12500,
                    12500,
                    NOW() AT TIME ZONE 'utc',
                    NOW() AT TIME ZONE 'utc'
                FROM "Invoices" AS i
                INNER JOIN "Users" AS u ON i."CustomerId" = u."Id"
                WHERE i."InvoiceNumber" LIKE 'INV-OVERDUE-SEED-%'
                  AND NOT EXISTS (
                    SELECT 1 FROM "InvoiceItems" AS ii WHERE ii."InvoiceId" = i."Id"
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
