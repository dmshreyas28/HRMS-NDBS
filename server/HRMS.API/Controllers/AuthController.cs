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
        private readonly Microsoft.Extensions.Logging.ILogger<AuthController> _logger;

        public AuthController(MongoDbService db, Microsoft.Extensions.Logging.ILogger<AuthController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            foreach (var claim in User.Claims)
            {
                _logger.LogWarning("JWT CLAIM => Type: {Type}, Value: {Value}", claim.Type, claim.Value);
            }
            var auth0Id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst("https://hrms.app/email")?.Value ?? "no-email@auth0.com"; // Adjust if mapping standard email claim
            var roleStr = User.FindFirst("https://hrms.app/roles")?.Value ?? "undefined";

            if (string.IsNullOrEmpty(auth0Id))
                return Unauthorized();

            // Map string role to UserRole enum (case-insensitive) — fail loudly on unrecognized values
            UserRole? userRole = null;
            if (roleStr.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                userRole = UserRole.Admin;
            }
            else if (roleStr.Equals("hr_ta", StringComparison.OrdinalIgnoreCase) || roleStr.Equals("hr/ta", StringComparison.OrdinalIgnoreCase))
            {
                userRole = UserRole.HR_TA;
            }
            else if (roleStr.Equals("hm", StringComparison.OrdinalIgnoreCase))
            {
                userRole = UserRole.HM;
            }

            if (userRole == null)
            {
                return StatusCode(500, new
                {
                    success = false,
                    error = $"Unrecognized role claim value from Auth0: '{roleStr}'. Expected one of: hm, hr_ta, admin."
                });
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
                    Role = userRole.Value
                };
                await _db.Users.InsertOneAsync(user);
            }
            else if (user.Role != userRole.Value)
            {
                // Update role if changed in Auth0
                var update = Builders<User>.Update.Set(u => u.Role, userRole.Value);
                await _db.Users.UpdateOneAsync(u => u.Id == user.Id, update);
                user.Role = userRole.Value;
            }

            var debugClaims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            return Ok(new { success = true, data = user, debugClaims = debugClaims });
        }
    }
}