using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Hangfire;
using Hangfire.Mongo;
using Hangfire.Mongo.Migration.Strategies;
using Hangfire.Mongo.Migration.Strategies.Backup;
using MongoDB.Driver;

using HRMS.API.Repositories;
using HRMS.API.Services;
using HRMS.API.Middleware;
using HRMS.API.Jobs;
using FluentValidation;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<HRMS.API.Services.MongoDbService>();  

// Register Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPositionRepository, PositionRepository>();
builder.Services.AddScoped<ICandidateRepository, CandidateRepository>();
builder.Services.AddScoped<NotificationRepository>();
builder.Services.AddScoped<MrfTemplateRepository>();
builder.Services.AddScoped<CostCentreRepository>();
builder.Services.AddScoped<DoAEntryRepository>();
builder.Services.AddScoped<ResignationRepository>();

// Register Services
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<PositionService>();
builder.Services.AddScoped<CandidateService>();

// Register Hangfire
var mongoUrlBuilder = new MongoUrlBuilder(builder.Configuration.GetConnectionString("MongoDb"));
var mongoClientForHangfire = new MongoClient(mongoUrlBuilder.ToMongoUrl());
builder.Services.AddHangfire(config => 
{
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UseMongoStorage(mongoClientForHangfire, mongoUrlBuilder.DatabaseName ?? "hrms", new MongoStorageOptions
          {
              MigrationOptions = new MongoMigrationOptions
              {
                  MigrationStrategy = new MigrateMongoMigrationStrategy(),
                  BackupStrategy = new NoneMongoBackupStrategy()
              },
              Prefix = "hangfire.",
              CheckConnection = true,
              CheckQueuedJobsStrategy = CheckQueuedJobsStrategy.TailNotificationsCollection
          });
});
builder.Services.AddHangfireServer();
builder.Services.AddScoped<HangfireJobs>();

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Register FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<HRMS.API.Validators.CreatePositionRequestValidator>();

// Register Exception Handler
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Add Authentication and Authorization
builder.Services.AddScoped<IClaimsTransformation, ClaimsTransformation>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var domain = builder.Configuration["Auth0:Domain"];
    options.Authority = $"https://{domain}/";
    options.Audience = builder.Configuration["Auth0:Audience"];
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = ClaimTypes.NameIdentifier
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("HMOnly", p => p.RequireAssertion(ctx =>
        ctx.User.Claims.Any(c => c.Type == "https://hrms.app/roles" && c.Value.Equals("hm", StringComparison.OrdinalIgnoreCase))));
    options.AddPolicy("TAOnly", p => p.RequireAssertion(ctx =>
        ctx.User.Claims.Any(c => c.Type == "https://hrms.app/roles" && c.Value.Equals("hr_ta", StringComparison.OrdinalIgnoreCase))));
    options.AddPolicy("AdminOnly", p => p.RequireAssertion(ctx =>
        ctx.User.Claims.Any(c => c.Type == "https://hrms.app/roles" && c.Value.Equals("admin", StringComparison.OrdinalIgnoreCase))));
    options.AddPolicy("HMOrTA", p => p.RequireAssertion(ctx =>
        ctx.User.Claims.Any(c => c.Type == "https://hrms.app/roles" &&
            (c.Value.Equals("hm", StringComparison.OrdinalIgnoreCase) || c.Value.Equals("hr_ta", StringComparison.OrdinalIgnoreCase) || c.Value.Equals("admin", StringComparison.OrdinalIgnoreCase)))));
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Serve uploaded files (CVs) from wwwroot-style /uploads directory
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Configure Hangfire Dashboard
app.UseHangfireDashboard();

// Register the recurring jobs
using (var scope = app.Services.CreateScope())
{
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
    var hangfireJobs = scope.ServiceProvider.GetRequiredService<HangfireJobs>();

    // Approval Reminder (daily)
    recurringJobManager.AddOrUpdate(
        "approval-reminder",
        () => hangfireJobs.SendApprovalRemindersAsync(),
        Cron.Daily);

    // Job Not Posted (every 2 hours)
    recurringJobManager.AddOrUpdate(
        "job-not-posted-reminder",
        () => hangfireJobs.SendJobNotPostedRemindersAsync(),
        "0 */2 * * *"); // every 2 hours

    // Hold Expiry (daily)
    recurringJobManager.AddOrUpdate(
        "hold-expiry-check",
        () => hangfireJobs.CheckHoldExpiringAsync(),
        Cron.Daily);

    // Inactivity Collapse (daily)
    recurringJobManager.AddOrUpdate(
        "inactivity-collapse-check",
        () => hangfireJobs.CheckInactivityCollapseAsync(),
        Cron.Daily);
}

app.MapControllers();

app.Run();
