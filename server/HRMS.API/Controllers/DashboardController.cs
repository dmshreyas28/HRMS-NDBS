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

            // Fetch positions raised by this HM
            var myPositions = await _positionRepo.FindAsync(p => p.RaisedBy == userId);

            var activeCount = myPositions.Count(p => p.Status == PositionStatus.APPROVED || p.Status == PositionStatus.POSTED || p.Status == PositionStatus.ON_HOLD);
            var pendingApprovalCount = myPositions.Count(p => p.Status == PositionStatus.PENDING_APPROVAL);
            var draftCount = myPositions.Count(p => p.Status == PositionStatus.DRAFT);

            // Inactivity Warnings (older than 150 days, and not closed/rejected/collapsed)
            var warningThreshold = DateTime.UtcNow.AddDays(-150);
            var warningCount = myPositions.Count(p => 
                p.Status != PositionStatus.FILLED && 
                p.Status != PositionStatus.COLLAPSED && 
                p.Status != PositionStatus.REJECTED && 
                p.LastHMActionAt < warningThreshold);

            // Resignations pending action of direct reports
            var pendingResignations = await _resignationRepo.FindAsync(r => r.ManagerId == userId && r.Status == "PENDING_ACTION");

            // Build recent activities (last 5 audit entries across all my positions)
            var recentActivities = myPositions
                .SelectMany(p => p.AuditLog.Select(a => new { p.JobTitle, p.JobCode, Audit = a }))
                .OrderByDescending(a => a.Audit.Timestamp)
                .Take(5)
                .ToList();

            var data = new
            {
                ActivePositions = activeCount,
                PendingApprovals = pendingApprovalCount,
                Drafts = draftCount,
                InactivityWarnings = warningCount,
                PendingResignations = pendingResignations.Count,
                RecentActivities = recentActivities
            };

            return Ok(ApiResponse<object>.Ok(data));
        }

        [HttpGet("ta")]
        [Authorize(Policy = "TAOnly")]
        public async Task<IActionResult> GetTaDashboard()
        {
            // TA Dashboard sees all positions except drafts
            var allActivePositions = await _positionRepo.FindAsync(p => p.Status != PositionStatus.DRAFT);
            
            var approvedNotPostedCount = allActivePositions.Count(p => p.Status == PositionStatus.APPROVED && p.JobPostedAt == null);
            var postedCount = allActivePositions.Count(p => p.Status == PositionStatus.POSTED);
            var holdCount = allActivePositions.Count(p => p.Status == PositionStatus.ON_HOLD);
            var pendingApprovalCount = allActivePositions.Count(p => p.Status == PositionStatus.PENDING_APPROVAL);

            // Fetch candidates
            var allCandidates = await _candidateRepo.GetAllAsync();
            var hiredThisMonthCount = allCandidates.Count(c => c.CurrentStage == CandidateStage.HIRED && c.UpdatedAt > DateTime.UtcNow.AddDays(-30));

            var data = new
            {
                ApprovedNotPosted = approvedNotPostedCount,
                PostedPositions = postedCount,
                OnHoldPositions = holdCount,
                PendingApprovals = pendingApprovalCount,
                HiredThisMonth = hiredThisMonthCount,
                TotalCandidates = allCandidates.Count
            };

            return Ok(ApiResponse<object>.Ok(data));
        }

        [HttpGet("admin")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var allPositions = await _positionRepo.GetAllAsync();
            var allUsers = await _userRepo.GetAllAsync();
            var allCostCentres = await _costCentreRepo.GetAllAsync();
            var allTemplates = await _mrfTemplateRepo.GetAllAsync();

            // Group positions by status
            var statusCounts = allPositions
                .GroupBy(p => p.Status.ToString())
                .ToDictionary(g => g.Key, g => g.Count());

            // Ensure all statuses exist in the dictionary
            foreach (var status in Enum.GetNames(typeof(PositionStatus)))
            {
                if (!statusCounts.ContainsKey(status))
                {
                    statusCounts[status] = 0;
                }
            }

            var data = new
            {
                TotalPositions = allPositions.Count,
                TotalUsers = allUsers.Count,
                TotalCostCentres = allCostCentres.Count,
                TotalTemplates = allTemplates.Count,
                StatusBreakdown = statusCounts
            };

            return Ok(ApiResponse<object>.Ok(data));
        }
    }
}
