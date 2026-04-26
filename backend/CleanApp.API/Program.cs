using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using CleanApp.API.OpenApi;
using CleanApp.Application;
using CleanApp.Application.Ai;
using CleanApp.Application.Auth;
using CleanApp.Infrastructure;
using CleanApp.Infrastructure.Jobs;
using CleanApp.Infrastructure.Persistence;
using CleanApp.Infrastructure.Seeding;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ── JSON serialisation ──────────────────────────────────────────
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// ── Swagger ─────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddPrecisionPartsSwagger();

// ── Infrastructure + Application DI ─────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// ── Auth (JWT from cookie) ──────────────────────────────────────
var jwtSettings = new JwtSettings();
builder.Configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
        ClockSkew = TimeSpan.Zero
    };

    // Read JWT from cookie if no Authorization header
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.TryGetValue("pp_auth", out var token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ── Gemini AI service ───────────────────────────────────────────
builder.Services.AddHttpClient<IGeminiService, GeminiService>();

// ── Hangfire (background jobs) ──────────────────────────────────
var hangfireConnectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION") 
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(options =>
        options.UseNpgsqlConnection(hangfireConnectionString!)));
builder.Services.AddHangfireServer();
builder.Services.AddTransient<LowStockAlertJob>();
builder.Services.AddTransient<OverdueCreditReminderJob>();

// ── CORS ────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// ── Swagger UI ──────────────────────────────────────────────────
var swaggerEnabled = app.Environment.IsDevelopment()
    || app.Configuration.GetValue("Swagger:Enabled", false);

if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Precision Parts v1");
        options.DocumentTitle = "Precision Parts — API explorer";
        options.DisplayRequestDuration();
        options.DefaultModelsExpandDepth(2);
        options.EnableTryItOutByDefault();
    });
}

// ── Middleware pipeline ─────────────────────────────────────────
app.UseCors("CorsPolicy");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── Database seed ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Run migrations on startup
    await db.Database.MigrateAsync();
    await DatabaseSeeder.SeedAsync(db);
}

// ── Hangfire dashboard (admin only in production) ───────────────
app.MapHangfireDashboard("/hangfire");

// ── Schedule recurring background jobs ──────────────────────────
RecurringJob.AddOrUpdate<LowStockAlertJob>(
    "low-stock-alert",
    job => job.ExecuteAsync(),
    Cron.Hourly);

RecurringJob.AddOrUpdate<OverdueCreditReminderJob>(
    "overdue-credit-reminder",
    job => job.ExecuteAsync(),
    Cron.Daily);

app.Run();