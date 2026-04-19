using CleanApp.Application.Admin;
using CleanApp.Application.CustomerPortal;
using CleanApp.Application.Customers;
using CleanApp.Application.Demo;
using CleanApp.Application.Notifications;
using CleanApp.Application.Parts;
using CleanApp.Application.Staff;
using CleanApp.Application.Vendors;
using Microsoft.Extensions.DependencyInjection;

namespace CleanApp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<IDemoContentProvider, DemoContentProvider>();

        services.AddScoped<IPartsService, PartsService>();
        services.AddScoped<IVendorsService, VendorsService>();
        services.AddScoped<ICustomersService, CustomersService>();

        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IAdminFinancialService, AdminFinancialService>();
        services.AddScoped<IAdminInventoryReportsService, AdminInventoryReportsService>();
        services.AddScoped<IAdminStaffService, AdminStaffService>();

        services.AddScoped<ICustomerDashboardService, CustomerDashboardService>();
        services.AddScoped<ICustomerOrdersService, CustomerOrdersService>();
        services.AddScoped<ICustomerAiService, CustomerAiService>();

        services.AddScoped<INotificationsService, NotificationsService>();
        services.AddScoped<IStaffPosService, StaffPosService>();

        return services;
    }
}
