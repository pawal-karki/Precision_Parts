using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CleanApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InvoicePosCreatedByAndStaffNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Invoices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StaffNotes",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CreatedByUserId",
                table: "Invoices",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Users_CreatedByUserId",
                table: "Invoices",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Users_CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "StaffNotes",
                table: "Invoices");
        }
    }
}
