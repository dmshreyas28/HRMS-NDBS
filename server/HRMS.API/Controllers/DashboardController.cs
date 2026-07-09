using System;
using System.Collections.Generic;
using System.Linq;
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
    public class DashboardController : BaseController
    {
        private readonly IPositionRepository _positionRepo;
        private readonly ICandidateRepository _candidateRepo;
        private readonly IUserRepository _userRepo;
        private readonly IResignationRepository _resignationRepo;
        private readonly ICostCentreRepository _costCentreRepo;
        private readonly IMrfTemplateRepository _mrfTemplateRepo;

        public DashboardController(
            IPositionRepository positionRepo,
            ICandidateRepository candidateRepo,
            IUserRepository userRepo,
            IResignationRepository resignationRepo,
            ICostCentreRepository costCentreRepo,
            IMrfTemplateRepository mrfTemplateRepo)
        {
            _positionRepo = positionRepo;
            _candidateRepo = candidateRepo;
            _userRepo = userRepo;
            _resignationRepo = resignationRepo;
            _costCentreRepo = costCentreRepo;
            _mrfTemplateRepo = mrfTemplateRepo;
        }

        [HttpGet("hm")]
        [Authorize(Policy = "HMOnly")]
        public async Task<IActionResult> GetHmDashboard()
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);

            var rawCounts = await _positionRepo.GetHmStatusBreakdownAsync(userId);
            var counts = new Dictionary<string, int>
            {
                { "draft", rawCounts.GetValueOrDefault("DRAFT", 0) },
                { "pending", rawCounts.GetValueOrDefault("PENDING_APPROVAL", 0) },
                { "approved", rawCounts.GetValueOrDefault("APPROVED", 0) },
                { "posted", rawCounts.GetValueOrDefault("POSTED", 0) },
                { "onHold", rawCounts.GetValueOrDefault("ON_HOLD", 0) },
                { "filled", rawCounts.GetValueOrDefault("FILLED", 0) },
                { "collapsed", rawCounts.GetValueOrDefault("COLLAPSED", 0) }
            };

            // awaitingMyAction: drafts and rejected positions for this HM
            var awaitingMyAction = await _positionRepo.FindAsync(p => 
                p.RaisedBy == userId && 
                (p.Status == PositionStatus.DRAFT || p.Status == PositionStatus.REJECTED));

            // onHold details:
            var heldPositions = await _positionRepo.FindAsync(p => 
                p.RaisedBy == userId && 
                p.Status == PositionStatus.ON_HOLD);
            var onHoldList = heldPositions.Select(p => new
            {
                id = p.Id,
                jobTitle = p.JobTitle,
                daysRemaining = p.OnHold.ExpiresAt.HasValue ? Math.Max(0, (int)Math.Ceiling((p.OnHold.ExpiresAt.Value - DateTime.UtcNow).TotalDays)) : 0
            }).ToList();

            // openPositions: this HM's non-draft, non-collapsed positions
            var openPositions = await _positionRepo.FindAsync(p => 
                p.RaisedBy == userId && 
                p.Status != PositionStatus.DRAFT && 
                p.Status != PositionStatus.COLLAPSED);

            var data = new
            {
                counts = counts,
                awaitingMyAction = awaitingMyAction,
                onHold = onHoldList,
                openPositions = openPositions
            };

            return Ok(ApiResponse<object>.Ok(data));
        }

        [HttpGet("ta")]
        [Authorize(Policy = "TAOnly")]
        public async Task<IActionResult> GetTaDashboard()
        {
            var notYetPosted = await _positionRepo.FindAsync(p => p.Status == PositionStatus.APPROVED && p.JobPostedAt == null);
            var pendingApprovals = await _positionRepo.FindAsync(p => p.Status == PositionStatus.PENDING_APPROVAL);

            var postedPositions = await _positionRepo.FindAsync(p => p.Status == PositionStatus.POSTED);

            var stageCounts = await _candidateRepo.GetStageCountsGroupedByPositionAsync();
            var stageCountsByPosition = stageCounts
                .GroupBy(sc => sc.PositionId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var pipelineSummaries = new List<object>();
            foreach (var p in postedPositions)
            {
                var countsForPos = stageCountsByPosition.GetValueOrDefault(p.Id!, new List<CandidateStageCount>());
                var total = countsForPos.Sum(c => c.Count);
                var byStage = countsForPos.ToDictionary(c => c.Stage, c => c.Count);

                pipelineSummaries.Add(new
                {
                    id = p.Id,
                    jobTitle = p.JobTitle,
                    total = total,
                    byStage = byStage
                });
            }

            var data = new
            {
                notYetPosted = notYetPosted,
                pendingApprovals = pendingApprovals,
                pipelineSummaries = pipelineSummaries
            };

            return Ok(ApiResponse<object>.Ok(data));
        }

        [HttpGet("admin")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var totalPositions = await _positionRepo.CountAsync();
            var totalUsers = await _userRepo.CountAsync();

            // approachingCollapse: (DateTime.UtcNow - LastHMActionAt).TotalDays >= 150, and not filled/collapsed/rejected
            var thresholdDate = DateTime.UtcNow.AddDays(-150);
            var inactivePositions = await _positionRepo.FindAsync(p =>
                p.Status != PositionStatus.FILLED &&
                p.Status != PositionStatus.COLLAPSED &&
                p.Status != PositionStatus.REJECTED &&
                p.LastHMActionAt <= thresholdDate);

            var approachingCollapse = inactivePositions.Select(p => new
            {
                id = p.Id,
                jobTitle = p.JobTitle,
                daysSince = (int)(DateTime.UtcNow - p.LastHMActionAt).TotalDays
            }).ToList();

            var rawStatus = await _positionRepo.GetStatusBreakdownAsync();
            var byStatus = new Dictionary<string, int>();
            foreach (var statusName in Enum.GetNames(typeof(PositionStatus)))
            {
                byStatus[statusName] = rawStatus.GetValueOrDefault(statusName, 0);
            }

            var rawRoles = await _userRepo.GetUsersRoleBreakdownAsync();
            var usersByRole = new Dictionary<string, int>();
            foreach (var roleName in Enum.GetNames(typeof(UserRole)))
            {
                usersByRole[roleName] = rawRoles.GetValueOrDefault(roleName, 0);
            }

            var data = new
            {
                totalPositions = totalPositions,
                totalUsers = totalUsers,
                approachingCollapse = approachingCollapse,
                byStatus = byStatus,
                usersByRole = usersByRole
            };

            return Ok(ApiResponse<object>.Ok(data));
        }
    }
}
