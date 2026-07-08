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
        Task<Position> AutoClosePositionAsync(string id, string actorUserId);
        Task UpdateReviewerEmailDraftAsync(string id, string draft, string actorUserId);
        Task SendReviewerEmailAsync(string id, string actorUserId);
    }

    public class PositionService : IPositionService
    {
        private readonly IPositionRepository _positionRepo;
        private readonly IUserRepository _userRepo;
        private readonly INotificationService _notificationService;

        public PositionService(
            IPositionRepository positionRepo,
            IUserRepository userRepo,
            INotificationService notificationService)
        {
            _positionRepo = positionRepo;
            _userRepo = userRepo;
            _notificationService = notificationService;
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
                MrfTemplateId = request.MrfTemplateId,
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
