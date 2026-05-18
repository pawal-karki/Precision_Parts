using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CleanApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnsurePawalCustomerProfileCredit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing user may have no CustomerProfiles row — ledger then reads OutstandingCredit as 0.
            migrationBuilder.Sql("""
                INSERT INTO "CustomerProfiles" (
                    "UserId", "LoyaltyTier", "TotalSpent", "PreferredContact",
                    "AccountKind", "AccountStatus", "OutstandingCredit", "LastOrderDate"
                )
                SELECT
                    u."Id",
                    'Gold',
                    139221.97,
                    'email',
                    'Individual',
                    'Credit Overdue',
                    12500,
                    (CURRENT_DATE - INTERVAL '45 days')
                FROM "Users" AS u
                WHERE u."Role" = 3
                  AND LOWER(u."Email") = 'pawal.karkidholi@koshistjames.edu.np'
                  AND NOT EXISTS (
                    SELECT 1 FROM "CustomerProfiles" AS cp WHERE cp."UserId" = u."Id"
                  );
                """);

            migrationBuilder.Sql("""
                UPDATE "CustomerProfiles" AS cp
                SET "OutstandingCredit" = 12500,
                    "LastOrderDate" = (CURRENT_DATE - INTERVAL '45 days'),
                    "AccountStatus" = 'Credit Overdue'
                FROM "Users" AS u
                WHERE cp."UserId" = u."Id"
                  AND u."Role" = 3
                  AND LOWER(u."Email") = 'pawal.karkidholi@koshistjames.edu.np';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
