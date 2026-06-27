using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepo;

        public UsersController(IUserRepository userRepo)
        {
            _userRepo = userRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userRepo.GetAllAsync();
            return Ok(ApiResponse<List<User>>.Ok(users));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _userRepo.GetByIdAsync(id);
            if (user == null)
                return NotFound(ApiResponse.Fail("User not found."));
            return Ok(ApiResponse<User>.Ok(user));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] User user)
        {
            await _userRepo.CreateAsync(user);
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, ApiResponse<User>.Ok(user));
        }

        [HttpPatch("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] UserUpdateRequest request)
        {
            var user = await _userRepo.GetByIdAsync(id);
            if (user == null)
                return NotFound(ApiResponse.Fail("User not found."));

            user.Name = request.Name;
            user.Email = request.Email;
            user.Role = request.Role;
            user.CostCentre = request.CostCentre;
            user.Department = request.Department;
            user.IsActive = request.IsActive;

            await _userRepo.UpdateAsync(id, user);
            return Ok(ApiResponse<User>.Ok(user));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userRepo.GetByIdAsync(id);
            if (user == null)
                return NotFound(ApiResponse.Fail("User not found."));

            user.IsActive = false;
            await _userRepo.UpdateAsync(id, user);
            return Ok(ApiResponse.Ok());
        }
    }
}
