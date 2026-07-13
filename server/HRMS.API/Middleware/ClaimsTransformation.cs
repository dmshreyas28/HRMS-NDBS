using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Middleware
{
    public class ClaimsTransformation : IClaimsTransformation
    {
        private readonly IServiceProvider _serviceProvider;

        public ClaimsTransformation(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            var identity = (ClaimsIdentity?)principal.Identity;
            if (identity == null || !identity.IsAuthenticated)
                return principal;

            // Check if roles claim is already present
            if (principal.HasClaim(c => c.Type == "https://hrms.app/roles"))
                return principal;

            var auth0Id = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(auth0Id))
                return principal;

            using (var scope = _serviceProvider.CreateScope())
            {
                var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
                var user = await userRepo.GetByAuth0IdAsync(auth0Id);
                
                if (user == null)
                {
                    // Sync new user automatically if not present in Mongo
                    var email = principal.FindFirst("https://hrms.app/email")?.Value 
                        ?? principal.FindFirst(ClaimTypes.Email)?.Value 
                        ?? principal.FindFirst("email")?.Value
                        ?? "no-email@auth0.com";

                    // Infer role from email for known demo accounts
                    UserRole inferredRole = UserRole.HM;
                    if (email.StartsWith("admin@", StringComparison.OrdinalIgnoreCase))
                        inferredRole = UserRole.Admin;
                    else if (email.StartsWith("ta@", StringComparison.OrdinalIgnoreCase))
                        inferredRole = UserRole.HR_TA;

                    user = new User
                    {
                        Auth0Id = auth0Id,
                        Email = email,
                        Name = email.Split('@')[0],
                        Role = inferredRole,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await userRepo.CreateAsync(user);
                }

                // Inject the roles claim dynamically from the database
                var roleName = user.Role.ToString().ToLower(); // "hm", "hr_ta", "admin"
                identity.AddClaim(new Claim("https://hrms.app/roles", roleName));

                // Inject other claims if they are missing
                if (!principal.HasClaim(c => c.Type == "https://hrms.app/email"))
                {
                    identity.AddClaim(new Claim("https://hrms.app/email", user.Email));
                }
                if (!principal.HasClaim(c => c.Type == "https://hrms.app/userId"))
                {
                    identity.AddClaim(new Claim("https://hrms.app/userId", user.Id!));
                }
            }

            return principal;
        }
    }
}
