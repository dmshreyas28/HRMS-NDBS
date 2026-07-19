using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Repositories;
using HRMS.API.Services;

namespace HRMS.API.Controllers
{
    public class LogResignationRequest
    {
        public string EmployeeName { get; set; } = null!;
        public string EmployeeEmail { get; set; } = null!;
        public string EmployeePhone { get; set; } = null!;
        public string Bu { get; set; } = null!;
        public string Department { get; set; } = null!;
        public decimal LastSalary { get; set; }
        public string JobTitle { get; set; } = null!;
        public string CostCentreId { get; set; } = null!;
    }

    public class ResignationDecisionRequest
    {
        public string Decision { get; set; } = null!; // "HIRE" or "NO_HIRE"
        public string? ReasonForLeaving { get; set; }
        public ColourCode? ColourCode { get; set; }
    }

    public class ApproveResignationRequest
    {
        public bool Approved { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ResignationsController : BaseController
    {
        private readonly ResignationRepository _resignationRepo;
        private readonly IUserRepository _userRepo;
        private readonly NotificationService _notificationService;

        public ResignationsController(ResignationRepository resignationRepo, IUserRepository userRepo, NotificationService notificationService)
        {
            _resignationRepo = resignationRepo;
            _userRepo = userRepo;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetResignations([FromQuery] string? status)
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);
            var resignations = await _resignationRepo.FindAsync(r => r.ManagerId == userId);
            if (!string.IsNullOrWhiteSpace(status))
            {
                resignations = resignations.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
            }
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

        [HttpGet("pending-approvals")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var all = await _resignationRepo.FindAsync(r => r.Status == "PENDING_APPROVAL");
            return Ok(ApiResponse<List<Resignation>>.Ok(all));
        }

        [HttpPost("log")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> LogResignation([FromBody] LogResignationRequest request)
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);

            var resignation = new Resignation
            {
                EmployeeId = $"EMP-{new Random().Next(1000, 9999)}",
                EmployeeName = request.EmployeeName,
                EmployeeEmail = request.EmployeeEmail,
                EmployeePhone = request.EmployeePhone,
                Bu = request.Bu,
                Department = request.Department,
                LastSalary = request.LastSalary,
                JobTitle = request.JobTitle,
                CostCentreId = request.CostCentreId,
                ManagerId = userId,
                Status = "PENDING_APPROVAL",
                CreatedAt = DateTime.UtcNow
            };

            await _resignationRepo.CreateAsync(resignation);
            return Ok(ApiResponse<Resignation>.Ok(resignation));
        }

        [HttpPost("approve/{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ApproveResignation(string id, [FromBody] ApproveResignationRequest request)
        {
            var resignation = await _resignationRepo.GetByIdAsync(id);
            if (resignation == null)
                return NotFound(ApiResponse.Fail("Resignation not found."));

            if (resignation.Status != "PENDING_APPROVAL")
                return Conflict(ApiResponse.Fail("This resignation has already been processed."));

            resignation.Status = request.Approved ? "APPROVED" : "REJECTED";
            await _resignationRepo.UpdateAsync(id, resignation);

            var message = request.Approved
                ? $"{resignation.EmployeeName}'s resignation has been approved. Decide whether to raise a replacement position."
                : $"{resignation.EmployeeName}'s resignation was not approved.";

            await _notificationService.SendNotificationAsync(
                resignation.ManagerId,
                NotificationType.RESIGNATION_ACTION,
                null,
                message
            );

            return Ok(ApiResponse<Resignation>.Ok(resignation));
        }

        [HttpPost("decide/{id}")]
        public async Task<IActionResult> DecideResignation(string id, [FromBody] ResignationDecisionRequest request)
        {
            var resignation = await _resignationRepo.GetByIdAsync(id);
            if (resignation == null)
                return NotFound(ApiResponse.Fail("Resignation not found."));

            var userId = await GetCurrentMongoUserIdAsync(_userRepo);
            if (resignation.ManagerId != userId)
                return Forbid();

            if (resignation.Status != "APPROVED")
                return Conflict(ApiResponse.Fail("Only approved resignations can be decided for replacement."));

            resignation.ReasonForLeaving = request.ReasonForLeaving;
            resignation.ColourCode = request.ColourCode;

            if (request.Decision.Equals("NO_HIRE", StringComparison.OrdinalIgnoreCase))
            {
                resignation.Status = "NO_REPLACEMENT";
                await _resignationRepo.UpdateAsync(id, resignation);
            }
            else
            {
                // HIRE: do not set REPLACED here; that happens atomically when the replacement MRF is created.
                // Just store the reason/colour for traceability.
                await _resignationRepo.UpdateAsync(id, resignation);
            }

            return Ok(ApiResponse<Resignation>.Ok(resignation));
        }
    }
}
