using Microsoft.OpenApi.Models;

namespace CleanApp.API.OpenApi;

public static class SwaggerExtensions
{
    public static IServiceCollection AddPrecisionPartsSwagger(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Precision Parts API",
                Version = "v1",
                Description =
                    "Vehicle parts inventory and customer service API. " +
                    "**Try it out** on any endpoint to run requests against your database.\n\n" +
                    "- **Parts / Vendors**: `GET` list rows include **`entityId`** (Guid) — use it in `PUT`/`DELETE` paths.\n" +
                    "- **Customers**: URLs use **`publicId`** (integer) from the list response.\n" +
                    "- **Health**: `GET /api/health` for a quick connectivity check.",
            });

            options.TagActionsBy(api =>
            {
                var p = api.RelativePath ?? "";
                if (p.StartsWith("api/admin/dashboard", StringComparison.OrdinalIgnoreCase))
                    return new[] { "1. Admin — Dashboard" };
                if (p.StartsWith("api/admin/financial", StringComparison.OrdinalIgnoreCase))
                    return new[] { "2. Admin — Financial" };
                if (p.StartsWith("api/admin/inventory", StringComparison.OrdinalIgnoreCase))
                    return new[] { "3. Admin — Inventory reports" };
                if (p.StartsWith("api/admin/parts", StringComparison.OrdinalIgnoreCase))
                    return new[] { "4. Admin — Parts (CRUD)" };
                if (p.StartsWith("api/admin/vendors", StringComparison.OrdinalIgnoreCase))
                    return new[] { "5. Admin — Vendors (CRUD)" };
                if (p.StartsWith("api/admin/staff", StringComparison.OrdinalIgnoreCase))
                    return new[] { "6. Admin — Staff directory" };
                if (p.StartsWith("api/admin/purchase-invoices", StringComparison.OrdinalIgnoreCase))
                    return new[] { "7. Admin — Purchase invoices (demo)" };
                if (p.StartsWith("api/staff/", StringComparison.OrdinalIgnoreCase))
                    return new[] { "8. Staff portal" };
                if (p.StartsWith("api/customer/", StringComparison.OrdinalIgnoreCase))
                    return new[] { "9. Customer portal" };
                if (p.StartsWith("api/notifications", StringComparison.OrdinalIgnoreCase))
                    return new[] { "10. Notifications" };
                if (p.StartsWith("api/health", StringComparison.OrdinalIgnoreCase))
                    return new[] { "0. Health" };
                return new[] { "Other" };
            });

            options.OrderActionsBy(apiDesc => apiDesc.RelativePath ?? "");
        });

        return services;
    }
}
