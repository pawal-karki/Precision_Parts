using CleanApp.Application.Email;
using CleanApp.Domain.Repositories;
using CleanApp.Infrastructure.Email;
using CleanApp.Infrastructure.Persistence;
using CleanApp.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Resend;

namespace CleanApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // ── Database ────────────────────────────────────────────────────────
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION") 
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        // ── Repositories ────────────────────────────────────────────────────
        services.AddScoped<IPartRepository, PartRepository>();
        services.AddScoped<IVendorRepository, VendorRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IAiPredictionRepository, AiPredictionRepository>();
        services.AddScoped<IMonthlyProjectionRepository, MonthlyProjectionRepository>();

        // ── Email (Resend) ──────────────────────────────────────────────────
        services.Configure<ResendEmailOptions>(
            configuration.GetSection(ResendEmailOptions.SectionName));

        services.AddOptions();
        services.AddHttpClient<ResendClient>();
        services.Configure<ResendClientOptions>(o =>
        {
            o.ApiToken = configuration[$"{ResendEmailOptions.SectionName}:ApiToken"]!;
        });
        services.AddTransient<IResend, ResendClient>();
        services.AddTransient<IEmailService, ResendEmailService>();

        return services;
    }
}
