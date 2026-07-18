using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Controllers
{
    public class BaseController : ControllerBase
    {
        protected string CurrentUserAuth0Id => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("Auth0 user identifier missing from token.");

        protected UserRole CurrentUserRole
        {
            get
            {
                var roleStr = User.FindFirst("https://hrms.app/roles")?.Value ?? "undefined";
                if (roleStr.Equals("admin", StringComparison.OrdinalIgnoreCase))
                    return UserRole.Admin;
                if (roleStr.Equals("hr_ta", StringComparison.OrdinalIgnoreCase) || roleStr.Equals("hr/ta", StringComparison.OrdinalIgnoreCase))
                    return UserRole.HR_TA;
                return UserRole.HM;
            }
        }

        private async Task<User> GetCurrentUserAsync(IUserRepository userRepo)
        {
            var auth0Id = CurrentUserAuth0Id;
            var user = await userRepo.GetByAuth0IdAsync(auth0Id);
            if (user == null)
            {
                var email = User.FindFirst("https://hrms.app/email")?.Value 
                    ?? User.FindFirst(ClaimTypes.Email)?.Value 
                    ?? "no-email@auth0.com";

                user = new User
                {
                    Auth0Id = auth0Id,
                    Email = email,
                    Name = email.Split('@')[0],
                    Role = CurrentUserRole,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                await userRepo.CreateAsync(user);
            }
            return user;
        }

        protected async Task<string> GetCurrentMongoUserIdAsync(IUserRepository userRepo)
        {
            var userIdClaim = User.FindFirst("https://hrms.app/userId")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim))
                return userIdClaim;

            var user = await GetCurrentUserAsync(userRepo);
            return user.Id!;
        }
    }
}
