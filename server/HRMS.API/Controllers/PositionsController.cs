using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Services;
using HRMS.API.Repositories;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PositionsController : BaseController
    {
        private readonly PositionService _positionService;
        private readonly IUserRepository _userRepo;

        public PositionsController(PositionService positionService, IUserRepository userRepo)
        {
            _positionService = positionService;
            _userRepo = userRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            PositionStatus? statusFilter = null;
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PositionStatus>(status, true, out var parsed))
            {
                statusFilter = parsed;
            }

            var positions = await _positionService.GetAllAsync(await GetCurrentMongoUserIdAsync(_userRepo), CurrentUserRole, statusFilter);
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
            var position = await _positionService.CreatePositionAsync(request, await GetCurrentMongoUserIdAsync(_userRepo));
            return CreatedAtAction(nameof(GetById), new { id = position.Id }, ApiResponse<Position>.Ok(position));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            await _positionService.DeletePositionAsync(id, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse.Ok());
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdatePositionRequest request)
        {
            var position = await _positionService.UpdatePositionAsync(id, request, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/submit")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> Submit(string id, [FromBody] SubmitPositionRequest request)
        {
            var position = await _positionService.SubmitForApprovalAsync(id, request, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/approve")]
        [Authorize(Policy = "HMOrTA")]
        public async Task<IActionResult> Approve(string id, [FromBody] ApprovePositionRequest request)
        {
            var position = await _positionService.ApprovePositionAsync(id, request.Notes, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/reject")]
        [Authorize(Policy = "HMOrTA")]
        public async Task<IActionResult> Reject(string id, [FromBody] RejectPositionRequest request)
        {
            var position = await _positionService.RejectPositionAsync(id, request.Reason, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/hold")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> Hold(string id, [FromBody] HoldPositionRequest request)
        {
            var position = await _positionService.PlaceOnHoldAsync(id, request.DurationDays, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/release-hold")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> ReleaseHold(string id)
        {
            var position = await _positionService.ReleaseHoldAsync(id, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/post")]
        [Authorize(Policy = "TAOnly")]
        public async Task<IActionResult> PostJob(string id)
        {
            var position = await _positionService.PostJobAsync(id, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPost("{id}/reopen")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Reopen(string id)
        {
            var position = await _positionService.ReopenPositionAsync(id, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPatch("{id}/reviewer-email")]
        [Authorize(Policy = "TAOnly")]
        public async Task<IActionResult> UpdateReviewerEmail(string id, [FromBody] UpdateReviewerEmailRequest request)
        {
            await _positionService.UpdateReviewerEmailDraftAsync(id, request.Draft, await GetCurrentMongoUserIdAsync(_userRepo));
            var position = await _positionService.GetByIdAsync(id);
            return Ok(ApiResponse<Position>.Ok(position));
        }

        [HttpPost("{id}/reviewer-email/send")]
        [Authorize(Policy = "TAOnly")]
        public async Task<IActionResult> SendReviewerEmail(string id)
        {
            await _positionService.SendReviewerEmailAsync(id, await GetCurrentMongoUserIdAsync(_userRepo));
            return Ok(ApiResponse<object>.Ok(new { sent = true }));
        }

        [HttpGet("{id}/audit")]
        public async Task<IActionResult> GetAuditTrail(string id)
        {
            var position = await _positionService.GetByIdAsync(id);
            return Ok(ApiResponse<List<AuditLogEntry>>.Ok(position.AuditLog));
        }
    }
}
