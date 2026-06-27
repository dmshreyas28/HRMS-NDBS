using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Services;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PositionsController : ControllerBase
    {
        private readonly IPositionService _positionService;

        public PositionsController(IPositionService positionService)
        {
            _positionService = positionService;
        }

        private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? throw new UnauthorizedAccessException("User identifier missing from request token.");

        private UserRole CurrentUserRole
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var positions = await _positionService.GetAllAsync(CurrentUserId, CurrentUserRole);
            return Ok(ApiResponse<List<Position>>.Ok(positions));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var position = await _positionService.GetByIdAsync(id);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPost]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> Create([FromBody] CreatePositionRequest request)
        {
            var position = await _positionService.CreatePositionAsync(request, CurrentUserId);
            return CreatedAtAction(nameof(GetById), new { id = position.Id }, ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdatePositionRequest request)
        {
            var position = await _positionService.UpdatePositionAsync(id, request, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/submit")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> Submit(string id, [FromBody] SubmitPositionRequest request)
        {
            var position = await _positionService.SubmitForApprovalAsync(id, request, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/approve")]
        [Authorize(Policy = "HMOrTA")]
        public async Task<IActionResult> Approve(string id, [FromBody] ApprovePositionRequest request)
        {
            var position = await _positionService.ApprovePositionAsync(id, request.Notes, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/reject")]
        [Authorize(Policy = "HMOrTA")]
        public async Task<IActionResult> Reject(string id, [FromBody] RejectPositionRequest request)
        {
            var position = await _positionService.RejectPositionAsync(id, request.Reason, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/hold")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> Hold(string id, [FromBody] HoldPositionRequest request)
        {
            var position = await _positionService.PlaceOnHoldAsync(id, request.DurationDays, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/release-hold")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> ReleaseHold(string id)
        {
            var position = await _positionService.ReleaseHoldAsync(id, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/post")]
        [Authorize(Policy = "TAOnly")]
        public async Task<IActionResult> PostJob(string id)
        {
            var position = await _positionService.PostJobAsync(id, CurrentUserId);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpGet("{id}/audit")]
        public async Task<IActionResult> GetAuditTrail(string id)
        {
            var position = await _positionService.GetByIdAsync(id);
            return Ok(ApiResponse<List<AuditLogEntry>>.Ok(position.AuditLog));
        }
    }
}
