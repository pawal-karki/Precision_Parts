using System.Globalization;

namespace CleanApp.Application.Demo;

/// <summary>Deterministic demo rows for the admin audit log UI.</summary>
internal static class DemoAuditLogData
{
    public static readonly IReadOnlyList<object> Rows = CreateRows();

    private static IReadOnlyList<object> CreateRows()
    {
        var list = new List<object>(52);
        var actors = new[] { "adrian.vance", "sarah.mitchell", "system", "api.service", "m.rodriguez", "warehouse.bot", "j.park" };
        var actions = new[]
        {
            "LOGIN", "LOGOUT", "INVENTORY_UPDATE", "INVOICE_PAID", "USER_ROLE_CHANGED", "EXPORT_RUN",
            "STOCK_ADJUST", "VENDOR_CREATED", "REORDER_APPROVED", "SESSION_REVOKED", "REPORT_DOWNLOAD",
            "AUTH_FAILURE", "PASSWORD_RESET", "API_KEY_ROTATED", "BULK_IMPORT", "PRICE_UPDATE",
        };
        var entities = new[] { "Part", "Invoice", "User", "Vendor", "Session", "Report", "PurchaseOrder", "StockLocation" };
        var severities = new[] { "info", "info", "info", "warning", "info", "error", "info" };

        for (var i = 0; i < 48; i++)
        {
            var ts = DateTime.UtcNow.AddMinutes(-(i + 1) * 37);
            var action = actions[i % actions.Length];
            var actor = actors[i % actors.Length];
            var entity = entities[i % entities.Length];
            var sev = severities[i % severities.Length];
            var details = action switch
            {
                "LOGIN" => $"Successful sign-in from workstation",
                "LOGOUT" => "Session ended normally",
                "INVENTORY_UPDATE" => $"SKU batch commit ({20 + i % 40} lines)",
                "INVOICE_PAID" => "Payment gateway confirmed settlement",
                "USER_ROLE_CHANGED" => "Role elevated to Inventory Manager",
                "EXPORT_RUN" => "Financial ledger CSV generated",
                "STOCK_ADJUST" => "Cycle count variance posted",
                "VENDOR_CREATED" => "Onboarding checklist completed",
                "REORDER_APPROVED" => "Auto-PO threshold crossed; approval recorded",
                "SESSION_REVOKED" => "Admin-initiated device revoke",
                "REPORT_DOWNLOAD" => "Profit and loss snapshot exported",
                "AUTH_FAILURE" => "Invalid credentials (rate-limited)",
                "PASSWORD_RESET" => "OTP verified; password rotated",
                "API_KEY_ROTATED" => "Integration key renewed",
                "BULK_IMPORT" => "Parts CSV ingested with validation",
                "PRICE_UPDATE" => "List price synced from vendor feed",
                _ => "Audit event recorded"
            };

            list.Add(new
            {
                id = i + 1,
                timestamp = ts.ToString("yyyy-MM-dd HH:mm:ss UTC", CultureInfo.InvariantCulture),
                actor,
                action,
                entity,
                details,
                reference = $"AUD-{100000 + i:D5}",
                severity = sev,
                badge = sev == "error" ? "error" : sev == "warning" ? "warning" : "neutral",
            });
        }

        return list;
    }
}
