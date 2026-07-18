using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Services
{
    public interface IPositionService
    {
        Task<Position> GetByIdAsync(string id);
        Task<List<Position>> GetAllAsync(string userId, UserRole role, PositionStatus? statusFilter = null);
        Task<Position> CreatePositionAsync(CreatePositionRequest request, string raisedByUserId);
        Task<Position> UpdatePositionAsync(string id, UpdatePositionRequest request, string actorUserId);
        Task<Position> SubmitForApprovalAsync(string id, SubmitPositionRequest request, string actorUserId);
        Task<Position> ApprovePositionAsync(string id, string notes, string actorUserId);
        Task<Position> RejectPositionAsync(string id, string reason, string actorUserId);
        Task<Position> PlaceOnHoldAsync(string id, int durationDays, string actorUserId);
        Task<Position> ReleaseHoldAsync(string id, string actorUserId);
        Task<Position> PostJobAsync(string id, string actorUserId);
        Task<Position> ReopenPositionAsync(string id, string actorUserId);
        Task<Position> AutoClosePositionAsync(string id, string actorUserId);
        Task UpdateReviewerEmailDraftAsync(string id, string draft, string actorUserId);
        Task SendReviewerEmailAsync(string id, string actorUserId);
        Task DeletePositionAsync(string id, string actorUserId);
    }

    public class PositionService : IPositionService
    {
        private readonly IPositionRepository _positionRepo;
        private readonly IUserRepository _userRepo;
        private readonly INotificationService _notificationService;
        private readonly ResignationRepository _resignationRepo;

        public PositionService(
            IPositionRepository positionRepo,
            IUserRepository userRepo,
            INotificationService notificationService,
            ResignationRepository resignationRepo)
        {
            _positionRepo = positionRepo;
            _userRepo = userRepo;
            _notificationService = notificationService;
            _resignationRepo = resignationRepo;
        }

        public async Task<Position> GetByIdAsync(string id)
        {
            var position = await _positionRepo.GetByIdAsync(id);
            if (position == null)
                throw new KeyNotFoundException("Position not found.");
            return position;
        }

        public async Task<List<Position>> GetAllAsync(string userId, UserRole role, PositionStatus? statusFilter = null)
        {
            List<Position> positions;
            if (role == UserRole.Admin)
            {
                positions = await _positionRepo.GetAllAsync();
            }
            else if (role == UserRole.HR_TA)
            {
                positions = await _positionRepo.FindAsync(p => p.Status != PositionStatus.DRAFT);
            }
            else
            {
                positions = await _positionRepo.FindAsync(p => p.RaisedBy == userId || p.ReviewerId == userId);
            }

            if (statusFilter.HasValue)
            {
                positions = positions.Where(p => p.Status == statusFilter.Value).ToList();
            }

            return positions;
        }

        public async Task<Position> CreatePositionAsync(CreatePositionRequest request, string raisedByUserId)
        {
            var position = new Position
            {
                PositionType = request.PositionType,
                Status = PositionStatus.DRAFT,
                CostCentre = request.CostCentre,
                JobCode = string.IsNullOrWhiteSpace(request.JobCode) ? GenerateJobCode(request.CostCentre) : request.JobCode,
                Division = request.Division,
                JobTitle = request.JobTitle,
                ReportingManager = request.ReportingManager,
                Jd = request.Jd,
                RequiredSkills = request.RequiredSkills,
                SalaryRange = new SalaryRange
                {
                    Min = request.SalaryRange.Min,
                    Max = request.SalaryRange.Max,
                    Currency = request.SalaryRange.Currency
                },
                RequiredStartDate = request.RequiredStartDate,
                ShiftTime = request.ShiftTime,
                ShiftDays = request.ShiftDays,
                Location = request.Location,
                ExperienceLevel = request.ExperienceLevel,
                ImpactIfUnfilled = request.ImpactIfUnfilled,
                SittingPlace = request.SittingPlace,
                RaisedBy = raisedByUserId,
                ReviewerId = request.ReviewerId,
                ApprovalSkipped = request.ApprovalSkipped,
                ApprovalSkippedReason = request.ApprovalSkippedReason,
                MrfTemplateId = string.IsNullOrWhiteSpace(request.MrfTemplateId) ? null : request.MrfTemplateId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (request.PositionType == PositionType.REPLACEMENT && request.ReplacementDetails != null)
            {
                position.ReplacementDetails = new ReplacementDetails
                {
                    ExEmployeeId = request.ReplacementDetails.ExEmployeeId,
                    ExEmployeeName = request.ReplacementDetails.ExEmployeeName,
                    ExEmployeeEmail = request.ReplacementDetails.ExEmployeeEmail,
                    ExEmployeePhone = request.ReplacementDetails.ExEmployeePhone,
                    Bu = request.ReplacementDetails.Bu,
                    Department = request.ReplacementDetails.Department,
                    LastSalary = request.ReplacementDetails.LastSalary,
                    ReasonForLeaving = request.ReplacementDetails.ReasonForLeaving,
                    ColourCode = request.ReplacementDetails.ColourCode
                };
            }

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Create Draft",
                ActorId = raisedByUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = "NONE",
                ToStatus = "DRAFT",
                Notes = "Created position requisition as draft."
            });

            await _positionRepo.CreateAsync(position);

            // If this was created from an approved resignation owned by this HM,
            // create the position first, then update the resignation afterwards
            // (standalone MongoDB — no multi-document transaction available).
            if (!string.IsNullOrWhiteSpace(request.ResignationId))
            {
                var resignation = await _resignationRepo.GetByIdAsync(request.ResignationId);
                if (resignation != null && resignation.Status == "APPROVED" && resignation.ManagerId == raisedByUserId)
                {
                    resignation.Status = "REPLACED";
                    resignation.ReplacementPositionId = position.Id;
                    await _resignationRepo.UpdateAsync(request.ResignationId, resignation);
                }
            }

            return position;
        }

        public async Task<Position> UpdatePositionAsync(string id, UpdatePositionRequest request, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.DRAFT)
                throw new InvalidOperationException("Only draft positions can be edited.");

            position.CostCentre = request.CostCentre;
            position.Division = request.Division;
            position.JobTitle = request.JobTitle;
            position.ReportingManager = request.ReportingManager;
            position.Jd = request.Jd;
            position.RequiredSkills = request.RequiredSkills;
            position.SalaryRange.Min = request.SalaryRange.Min;
            position.SalaryRange.Max = request.SalaryRange.Max;
            position.SalaryRange.Currency = request.SalaryRange.Currency;
            position.RequiredStartDate = request.RequiredStartDate;
            position.ShiftTime = request.ShiftTime;
            position.ShiftDays = request.ShiftDays;
            position.Location = request.Location;
            position.ExperienceLevel = request.ExperienceLevel;
            position.ImpactIfUnfilled = request.ImpactIfUnfilled;
            position.SittingPlace = request.SittingPlace;
            position.ReviewerId = request.ReviewerId;
            position.UpdatedAt = DateTime.UtcNow;
            position.LastHMActionAt = DateTime.UtcNow;

            if (position.PositionType == PositionType.REPLACEMENT && request.ReplacementDetails != null)
            {
                position.ReplacementDetails = new ReplacementDetails
                {
                    ExEmployeeId = request.ReplacementDetails.ExEmployeeId,
                    ExEmployeeName = request.ReplacementDetails.ExEmployeeName,
                    ExEmployeeEmail = request.ReplacementDetails.ExEmployeeEmail,
                    ExEmployeePhone = request.ReplacementDetails.ExEmployeePhone,
                    Bu = request.ReplacementDetails.Bu,
                    Department = request.ReplacementDetails.Department,
                    LastSalary = request.ReplacementDetails.LastSalary,
                    ReasonForLeaving = request.ReplacementDetails.ReasonForLeaving,
                    ColourCode = request.ReplacementDetails.ColourCode
                };
            }

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Update Draft",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = "DRAFT",
                ToStatus = "DRAFT",
                Notes = "Draft position details updated."
            });

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> SubmitForApprovalAsync(string id, SubmitPositionRequest request, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.DRAFT)
                throw new InvalidOperationException("Position is not in draft status.");

            // Enforce completeness on submission
            if (string.IsNullOrWhiteSpace(position.JobTitle))
                throw new ArgumentException("Job title is required to submit for approval.");
            if (string.IsNullOrWhiteSpace(position.CostCentre))
                throw new ArgumentException("Cost centre is required to submit for approval.");
            if (string.IsNullOrWhiteSpace(position.Division))
                throw new ArgumentException("Division is required to submit for approval.");
            if (string.IsNullOrWhiteSpace(position.Jd))
                throw new ArgumentException("Job description is required to submit for approval.");
            if (position.RequiredSkills == null || position.RequiredSkills.Count == 0)
                throw new ArgumentException("At least one required skill is required to submit for approval.");
            if (string.IsNullOrWhiteSpace(position.Location))
                throw new ArgumentException("Location is required to submit for approval.");
            if (string.IsNullOrWhiteSpace(position.ExperienceLevel))
                throw new ArgumentException("Experience level is required to submit for approval.");


            if (position.PositionType == PositionType.REPLACEMENT)
            {
                if (position.ReplacementDetails == null)
                    throw new ArgumentException("Replacement details are required for replacement position type.");
                if (string.IsNullOrWhiteSpace(position.ReplacementDetails.ExEmployeeId))
                    throw new ArgumentException("Ex-employee ID is required.");
                if (string.IsNullOrWhiteSpace(position.ReplacementDetails.ExEmployeeName))
                    throw new ArgumentException("Ex-employee name is required.");
                if (string.IsNullOrWhiteSpace(position.ReplacementDetails.ExEmployeeEmail))
                    throw new ArgumentException("Ex-employee email is required.");
                if (string.IsNullOrWhiteSpace(position.ReplacementDetails.ExEmployeePhone))
                    throw new ArgumentException("Ex-employee phone number is required.");
            }

            position.ReviewerId = request.ReviewerId;
            position.ApprovalSkipped = request.ApprovalSkipped;
            position.ApprovalSkippedReason = request.ApprovalSkippedReason;
            position.UpdatedAt = DateTime.UtcNow;
            position.LastHMActionAt = DateTime.UtcNow;

            var oldStatus = position.Status;

            if (request.ApprovalSkipped)
            {
                position.Status = PositionStatus.APPROVED;
                position.AuditLog.Add(new AuditLogEntry
                {
                    Action = "Submit (Approval Skipped)",
                    ActorId = actorUserId,
                    Timestamp = DateTime.UtcNow,
                    FromStatus = oldStatus.ToString(),
                    ToStatus = position.Status.ToString(),
                    Notes = $"Approval skipped. Reason: {request.ApprovalSkippedReason}"
                });

                await _notificationService.SendNotificationAsync(
                    "hr_ta_group",
                    NotificationType.POSITION_APPROVED,
                    position.Id!,
                    $"Position request '{position.JobTitle}' has been approved and is ready to post."
                );
            }
            else
            {
                position.Status = PositionStatus.PENDING_APPROVAL;
                position.AuditLog.Add(new AuditLogEntry
                {
                    Action = "Submit for Approval",
                    ActorId = actorUserId,
                    Timestamp = DateTime.UtcNow,
                    FromStatus = oldStatus.ToString(),
                    ToStatus = position.Status.ToString(),
                    Notes = "Submitted for review and approval."
                });

                string reviewerName = "Reviewer";
                string raisedByName = "Hiring Manager";
                if (!string.IsNullOrEmpty(request.ReviewerId))
                {
                    var reviewer = await _userRepo.GetByIdAsync(request.ReviewerId);
                    if (reviewer != null)
                    {
                        reviewerName = reviewer.Name;
                    }
                    await _notificationService.SendNotificationAsync(
                        request.ReviewerId,
                        NotificationType.APPROVAL_REMINDER,
                        position.Id!,
                        $"You have a pending approval request for '{position.JobTitle}' position."
                    );
                }

                var raisedBy = await _userRepo.GetByIdAsync(position.RaisedBy);
                if (raisedBy != null)
                {
                    raisedByName = raisedBy.Name;
                }

                position.ReviewerEmailDraft = BuildReviewerEmailDraft(position, reviewerName, raisedByName);
                position.ReviewerEmailSent = false;
            }

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> ApprovePositionAsync(string id, string notes, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.PENDING_APPROVAL)
                throw new InvalidOperationException("Only positions pending approval can be approved.");

            var oldStatus = position.Status;
            position.Status = PositionStatus.APPROVED;
            position.UpdatedAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Approve",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = notes
            });

            await _notificationService.SendNotificationAsync(
                position.RaisedBy,
                NotificationType.POSITION_APPROVED,
                position.Id!,
                $"Your position request '{position.JobTitle}' has been approved."
            );

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> RejectPositionAsync(string id, string reason, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.PENDING_APPROVAL)
                throw new InvalidOperationException("Only positions pending approval can be rejected.");

            var oldStatus = position.Status;
            position.Status = PositionStatus.REJECTED;
            position.UpdatedAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Reject",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = $"Rejected. Reason: {reason}"
            });

            await _notificationService.SendNotificationAsync(
                position.RaisedBy,
                NotificationType.POSITION_REJECTED,
                position.Id!,
                $"Your position request '{position.JobTitle}' was rejected. Reason: {reason}"
            );

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> PlaceOnHoldAsync(string id, int durationDays, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.APPROVED && position.Status != PositionStatus.POSTED)
                throw new InvalidOperationException("Only approved or posted positions can be placed on hold.");

            var oldStatus = position.Status;
            position.Status = PositionStatus.ON_HOLD;
            position.UpdatedAt = DateTime.UtcNow;
            position.LastHMActionAt = DateTime.UtcNow;

            position.OnHold = new OnHoldDetails
            {
                IsOnHold = true,
                HeldAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(durationDays)
            };

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Place On Hold",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = $"Placed on hold for {durationDays} days. Expires on: {position.OnHold.ExpiresAt:yyyy-MM-dd}."
            });

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> ReleaseHoldAsync(string id, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.ON_HOLD || position.OnHold?.HeldAt == null)
                throw new InvalidOperationException("Position is not currently on hold.");

            var holdDuration = DateTime.UtcNow - position.OnHold.HeldAt.Value;

            var prevStatus = PositionStatus.APPROVED;
            var holdEntry = position.AuditLog.LastOrDefault(a => a.Action == "Place On Hold");
            if (holdEntry != null && Enum.TryParse<PositionStatus>(holdEntry.FromStatus, out var parsedStatus))
            {
                prevStatus = parsedStatus;
            }

            var oldStatus = position.Status;
            position.Status = prevStatus;
            position.RequiredStartDate = position.RequiredStartDate.Add(holdDuration);
            position.UpdatedAt = DateTime.UtcNow;
            position.LastHMActionAt = DateTime.UtcNow;

            position.OnHold = new OnHoldDetails { IsOnHold = false };

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Release Hold",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = $"Hold released. Start date shifted forward by {holdDuration.Days} days."
            });

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> PostJobAsync(string id, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.APPROVED)
                throw new InvalidOperationException("Only approved positions can be marked as posted.");

            var oldStatus = position.Status;
            position.Status = PositionStatus.POSTED;
            position.JobPostedAt = DateTime.UtcNow;
            position.UpdatedAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Post Job",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = "Job vacancy marked as posted."
            });

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> ReopenPositionAsync(string id, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.COLLAPSED)
                throw new InvalidOperationException("Only collapsed positions can be reopened.");

            var oldStatus = position.Status;
            var targetStatus = PositionStatus.APPROVED;
            if (!string.IsNullOrWhiteSpace(position.PreCollapseStatus)
                && Enum.TryParse<PositionStatus>(position.PreCollapseStatus, out var parsed))
            {
                targetStatus = parsed;
            }

            position.Status = targetStatus;
            position.PreCollapseStatus = null;
            position.LastHMActionAt = DateTime.UtcNow;
            position.UpdatedAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Reopen",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = $"Position reopened from collapsed state. Restored to {position.Status}."
            });

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        public async Task<Position> AutoClosePositionAsync(string id, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.POSTED && position.Status != PositionStatus.APPROVED)
                throw new InvalidOperationException("Position is not in a fillable status.");

            var oldStatus = position.Status;
            position.Status = PositionStatus.FILLED;
            position.FilledAt = DateTime.UtcNow;
            position.UpdatedAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Close Position (Filled)",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = oldStatus.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = "Position closed automatically because a candidate was hired."
            });

            await _notificationService.SendNotificationAsync(
                position.RaisedBy,
                NotificationType.POSITION_FILLED,
                position.Id!,
                $"Position request '{position.JobTitle}' has been filled and closed."
            );

            await _positionRepo.UpdateAsync(id, position);
            return position;
        }

        private static string GenerateJobCode(string costCentre)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var random = new Random();
            var code = new char[6];
            for (int i = 0; i < 6; i++)
            {
                code[i] = chars[random.Next(chars.Length)];
            }
            return $"POS-{costCentre}-{new string(code)}";
        }

        public async Task UpdateReviewerEmailDraftAsync(string id, string draft, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            var user = await _userRepo.GetByIdAsync(actorUserId);
            
            position.ReviewerEmailDraft = draft;
            position.UpdatedAt = DateTime.UtcNow;
            position.LastHMActionAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Update Reviewer Email Draft",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = position.Status.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = $"{user?.Name ?? "HR/TA"} edited the reviewer email draft."
            });

            await _positionRepo.UpdateAsync(id, position);
        }

        public async Task SendReviewerEmailAsync(string id, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (string.IsNullOrEmpty(position.ReviewerEmailDraft))
                throw new InvalidOperationException("No email draft to send.");

            var reviewer = await _userRepo.GetByIdAsync(position.ReviewerId!);
            var email = reviewer?.Email ?? "reviewer@example.com";
            var name = reviewer?.Name ?? "Reviewer";

            await _notificationService.SendNotificationAsync(
                position.ReviewerId!,
                NotificationType.APPROVAL_REMINDER,
                position.Id!,
                position.ReviewerEmailDraft,
                NotificationChannel.EMAIL
            );

            position.ReviewerEmailSent = true;
            position.UpdatedAt = DateTime.UtcNow;
            position.LastHMActionAt = DateTime.UtcNow;

            position.AuditLog.Add(new AuditLogEntry
            {
                Action = "Send Reviewer Email",
                ActorId = actorUserId,
                Timestamp = DateTime.UtcNow,
                FromStatus = position.Status.ToString(),
                ToStatus = position.Status.ToString(),
                Notes = "Reviewer email sent."
            });

            await _positionRepo.UpdateAsync(id, position);
        }

        public async Task DeletePositionAsync(string id, string actorUserId)
        {
            var position = await GetByIdAsync(id);
            if (position.Status != PositionStatus.DRAFT)
                throw new InvalidOperationException("Only draft positions can be deleted.");

            if (position.RaisedBy != actorUserId)
                throw new UnauthorizedAccessException("You are not authorized to delete this draft.");

            await _positionRepo.DeleteAsync(id);
        }

        private static string BuildReviewerEmailDraft(Position p, string reviewerName, string raisedByName) =>
            $@"Hi {reviewerName},

A new Manpower Requisition Form has been submitted and requires your approval.

  Position:    {p.JobTitle}
  Cost centre: {p.CostCentre}
  Type:        {p.PositionType}
  Raised by:   {raisedByName}

Job summary:
{p.Jd}

Click here to review and approve/reject:
http://localhost:5173/positions/{p.Id}

— HRMS Talent Acquisition";
    }
}
