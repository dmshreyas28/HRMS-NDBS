using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Controllers
{
    public class ResignationDecisionRequest
    {
        public string Decision { get; set; } = null!; // "HIRE" or "NO_HIRE"
        public string? ReasonForLeaving { get; set; }
        public ColourCode? ColourCode { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ResignationsController : BaseController
    {
        private readonly ResignationRepository _resignationRepo;
        private readonly IUserRepository _userRepo;

        public ResignationsController(ResignationRepository resignationRepo, IUserRepository userRepo)
        {
            _resignationRepo = resignationRepo;
            _userRepo = userRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetResignations()
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);
            var resignations = await _resignationRepo.FindAsync(r => r.ManagerId == userId);
            return Ok(ApiResponse<List<Resignation>>.Ok(resignations));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var resignation = await _resignationRepo.GetByIdAsync(id);
            if (resignation == null)
                return NotFound(ApiResponse.Fail("Resignation not found."));
            return Ok(ApiResponse<Resignation>.Ok(resignation));
        }

        [HttpPost("decide/{id}")]
        public async Task<IActionResult> DecideResignation(string id, [FromBody] ResignationDecisionRequest request)
        {
            var resignation = await _resignationRepo.GetByIdAsync(id);
            if (resignation == null)
                return NotFound(ApiResponse.Fail("Resignation not found."));

            if (request.Decision.Equals("HIRE", StringComparison.OrdinalIgnoreCase))
            {
                resignation.Status = "REPLACED";
            }
            else
            {
                resignation.Status = "NO_REPLACEMENT";
            }

            resignation.ReasonForLeaving = request.ReasonForLeaving;
            resignation.ColourCode = request.ColourCode;

            await _resignationRepo.UpdateAsync(id, resignation);
            return Ok(ApiResponse<Resignation>.Ok(resignation));
        }

        [HttpPost("simulate")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> SimulateResignation([FromBody] Resignation resignation)
        {
            resignation.CreatedAt = DateTime.UtcNow;
            resignation.Status = "PENDING_ACTION";
            await _resignationRepo.CreateAsync(resignation);
            return Ok(ApiResponse<Resignation>.Ok(resignation));
        }
    }
}
