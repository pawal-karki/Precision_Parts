using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CleanApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExtendUserCustomerPart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PositionTitle",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BatchCode",
                table: "Parts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitOfMeasure",
                table: "Parts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WarehouseLocation",
                table: "Parts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccountKind",
                table: "CustomerProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AccountStatus",
                table: "CustomerProfiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateOnly>(
                name: "LastOrderDate",
                table: "CustomerProfiles",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OutstandingCredit",
                table: "CustomerProfiles",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Department",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PositionTitle",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BatchCode",
                table: "Parts");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasure",
                table: "Parts");

            migrationBuilder.DropColumn(
                name: "WarehouseLocation",
                table: "Parts");

            migrationBuilder.DropColumn(
                name: "AccountKind",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "AccountStatus",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "LastOrderDate",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "OutstandingCredit",
                table: "CustomerProfiles");
        }
    }
}
