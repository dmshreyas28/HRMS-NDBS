using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using HRMS.API.Models;
using HRMS.API.Services;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _db;

        public AuthController(MongoDbService db)
        {
            _db = db;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var auth0Id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst("https://hrms.app/email")?.Value ?? "no-email@auth0.com"; // Adjust if mapping standard email claim
            var roleStr = User.FindFirst("https://hrms.app/roles")?.Value ?? "undefined";

            if (string.IsNullOrEmpty(auth0Id))
                return Unauthorized();

            // Map string role to UserRole enum (case-insensitive)
            UserRole userRole = UserRole.HM;
            if (roleStr.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                userRole = UserRole.Admin;
            }
            else if (roleStr.Equals("hr_ta", StringComparison.OrdinalIgnoreCase) || roleStr.Equals("hr/ta", StringComparison.OrdinalIgnoreCase))
            {
                userRole = UserRole.HR_TA;
            }

            var user = await _db.Users.Find(u => u.Auth0Id == auth0Id).FirstOrDefaultAsync();

            if (user == null)
            {
                // Sync new user
                user = new User
                {
                    Auth0Id = auth0Id,
                    Email = email,
                    Name = email.Split('@')[0], 
                    Role = userRole
                };
                await _db.Users.InsertOneAsync(user);
            }
            else if (user.Role != userRole)
            {
                // Update role if changed in Auth0
                var update = Builders<User>.Update.Set(u => u.Role, userRole);
                await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
                user.Role = userRole;
            }

            return Ok(new { success = true, data = user });
        }
    }
}