using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

using HRMS.API.Repositories;
using HRMS.API.Services;
using HRMS.API.Middleware;

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
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IMrfTemplateRepository, MrfTemplateRepository>();
builder.Services.AddScoped<ICostCentreRepository, CostCentreRepository>();
builder.Services.AddScoped<IDoAEntryRepository, DoAEntryRepository>();

// Register Services
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPositionService, PositionService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();

// Add services to the container.

builder.Services.AddControllers();

// Register Exception Handler
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Add Authentication and Authorization
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
    options.AddPolicy("HMOnly", p => p.RequireClaim("https://hrms.app/roles", "hm"));
    options.AddPolicy("TAOnly", p => p.RequireClaim("https://hrms.app/roles", "hr_ta"));
    options.AddPolicy("AdminOnly", p => p.RequireClaim("https://hrms.app/roles", "admin"));
    options.AddPolicy("HMOrTA", p => p.RequireAssertion(ctx =>
        ctx.User.HasClaim("https://hrms.app/roles", "hm") ||
        ctx.User.HasClaim("https://hrms.app/roles", "hr_ta")));
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

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
