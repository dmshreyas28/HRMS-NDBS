using System;
using System.Linq;
using System.Threading.Tasks;
using HRMS.API.Models;
using HRMS.API.Repositories;
using HRMS.API.Services;

namespace HRMS.API.Jobs
{
    public class HangfireJobs
    {
        private readonly IPositionRepository _positionRepo;
        private readonly NotificationService _notificationService;
        private readonly NotificationRepository _notificationRepo;

        public HangfireJobs(
            IPositionRepository positionRepo,
            NotificationService notificationService,
            NotificationRepository notificationRepo)
        {
            _positionRepo = positionRepo;
            _notificationService = notificationService;
            _notificationRepo = notificationRepo;
        }

        // Job 1: Approval Reminder (Runs Daily)
        public async Task SendApprovalRemindersAsync()
        {
            var pendingPositions = await _positionRepo.FindAsync(p => p.Status == PositionStatus.PENDING_APPROVAL);
            foreach (var pos in pendingPositions)
            {
                if (string.IsNullOrEmpty(pos.ReviewerId)) continue;

                // Idempotence: check if an approval reminder notification was sent in the last 24 hours
                var recentNotification = await _notificationRepo.FindAsync(n => 
                    n.RecipientId == pos.ReviewerId && 
                    n.PositionId == pos.Id && 
                    n.Type == NotificationType.APPROVAL_REMINDER && 
                    n.CreatedAt > DateTime.UtcNow.AddDays(-1));

                if (!recentNotification.Any())
                {
                    await _notificationService.SendNotificationAsync(
                        pos.ReviewerId,
                        NotificationType.APPROVAL_REMINDER,
                        pos.Id!,
                        $"Reminder: You have a pending approval request for position '{pos.JobTitle}'."
                    );
                }
            }
        }

        // Job 2: Job Not Posted (Runs Every 2 Hours)
        public async Task SendJobNotPostedRemindersAsync()
        {
            var approvedPositions = await _positionRepo.FindAsync(p => 
                p.Status == PositionStatus.APPROVED && 
                p.JobPostedAt == null);

            foreach (var pos in approvedPositions)
            {
                // Idempotence: check if a job not posted notification was sent in the last 2 hours
                var recentNotification = await _notificationRepo.FindAsync(n => 
                    n.PositionId == pos.Id && 
                    n.Type == NotificationType.JOB_NOT_POSTED && 
                    n.CreatedAt > DateTime.UtcNow.AddHours(-2));

                if (!recentNotification.Any())
                {
                    await _notificationService.SendNotificationAsync(
                        "hr_ta_group",
                        NotificationType.JOB_NOT_POSTED,
                        pos.Id!,
                        $"Position '{pos.JobTitle}' ({pos.JobCode}) is approved but has not been posted."
                    );
                }
            }
        }

        // Job 3: Position Hold Expiry (Runs Daily)
        public async Task CheckHoldExpiringAsync()
        {
            var heldPositions = await _positionRepo.FindAsync(p => p.Status == PositionStatus.ON_HOLD && p.OnHold.IsOnHold);
            foreach (var pos in heldPositions)
            {
                if (pos.OnHold?.ExpiresAt == null) continue;

                var timeRemaining = pos.OnHold.ExpiresAt.Value - DateTime.UtcNow;

                // Hold Expired: Auto release
                if (timeRemaining.TotalMilliseconds <= 0)
                {
                    var holdDuration = DateTime.UtcNow - pos.OnHold.HeldAt!.Value;
                    
                    // Reconstruct previous status
                    var prevStatus = PositionStatus.APPROVED;
                    var holdEntry = pos.AuditLog.LastOrDefault(a => a.Action == "Place On Hold");
                    if (holdEntry != null && Enum.TryParse<PositionStatus>(holdEntry.FromStatus, out var parsedStatus))
                    {
                        prevStatus = parsedStatus;
                    }

                    var oldStatus = pos.Status;
                    pos.Status = prevStatus;
                    pos.RequiredStartDate = pos.RequiredStartDate.Add(holdDuration);
                    pos.UpdatedAt = DateTime.UtcNow;
                    pos.LastHMActionAt = DateTime.UtcNow;
                    pos.OnHold = new OnHoldDetails { IsOnHold = false };

                    pos.AuditLog.Add(new AuditLogEntry
                    {
                        Action = "Auto Release Hold",
                        ActorId = "system",
                        Timestamp = DateTime.UtcNow,
                        FromStatus = oldStatus.ToString(),
                        ToStatus = pos.Status.ToString(),
                        Notes = $"Hold automatically released after expiry. Start date shifted forward by {holdDuration.Days} days."
                    });

                    await _positionRepo.UpdateAsync(pos.Id!, pos);

                    await _notificationService.SendNotificationAsync(
                        pos.RaisedBy,
                        NotificationType.POSITION_HOLD_EXPIRY,
                        pos.Id!,
                        $"Hold on position '{pos.JobTitle}' has expired and was automatically released."
                    );
                }
                // Hold Expiring in <= 3 days: Warn HM
                else if (timeRemaining.TotalDays <= 3)
                {
                    // Check if already warned in last 24 hours
                    var recentWarning = await _notificationRepo.FindAsync(n =>
                        n.RecipientId == pos.RaisedBy &&
                        n.PositionId == pos.Id &&
                        n.Type == NotificationType.POSITION_HOLD_EXPIRY &&
                        n.CreatedAt > DateTime.UtcNow.AddDays(-1));

                    if (!recentWarning.Any())
                    {
                        await _notificationService.SendNotificationAsync(
                            pos.RaisedBy,
                            NotificationType.POSITION_HOLD_EXPIRY,
                            pos.Id!,
                            $"Warning: Hold on position '{pos.JobTitle}' expires in {Math.Ceiling(timeRemaining.TotalDays)} days."
                        );
                    }
                }
            }
        }

        // Job 4: Inactivity Collapse (Runs Daily)
        public async Task CheckInactivityCollapseAsync()
        {
            var activePositions = await _positionRepo.FindAsync(p => 
                p.Status != PositionStatus.FILLED && 
                p.Status != PositionStatus.COLLAPSED && 
                p.Status != PositionStatus.REJECTED);

            foreach (var pos in activePositions)
            {
                var inactivityDays = (DateTime.UtcNow - pos.LastHMActionAt).Days;

                // Day 180: Auto Collapse
                if (inactivityDays >= 180)
                {
                    var oldStatus = pos.Status;
                    pos.Status = PositionStatus.COLLAPSED;
                    pos.PreCollapseStatus = oldStatus.ToString();
                    pos.CollapsedAt = DateTime.UtcNow;
                    pos.UpdatedAt = DateTime.UtcNow;

                    pos.AuditLog.Add(new AuditLogEntry
                    {
                        Action = "Auto Collapse",
                        ActorId = "system",
                        Timestamp = DateTime.UtcNow,
                        FromStatus = oldStatus.ToString(),
                        ToStatus = pos.Status.ToString(),
                        Notes = "Position automatically collapsed due to 180 days of inactivity."
                    });

                    await _positionRepo.UpdateAsync(pos.Id!, pos);

                    // Notify HM
                    await _notificationService.SendNotificationAsync(
                        pos.RaisedBy,
                        NotificationType.POSITION_COLLAPSED,
                        pos.Id!,
                        $"Position '{pos.JobTitle}' has been collapsed automatically due to 180 days of inactivity."
                    );

                    // Notify Admin
                    await _notificationService.SendNotificationAsync(
                        "admin_group",
                        NotificationType.POSITION_COLLAPSED,
                        pos.Id!,
                        $"Position '{pos.JobTitle}' ({pos.JobCode}) raised by HM was collapsed due to 180 days of inactivity."
                    );
                }
                // Day 170: Urgent warning
                else if (inactivityDays >= 170)
                {
                    var recentWarning = await _notificationRepo.FindAsync(n =>
                        n.RecipientId == pos.RaisedBy &&
                        n.PositionId == pos.Id &&
                        n.Type == NotificationType.COLLAPSE_WARNING &&
                        n.CreatedAt > DateTime.UtcNow.AddDays(-10)); // check if day 170 warning was sent

                    if (!recentWarning.Any(n => n.Message.Contains("10 days")))
                    {
                        await _notificationService.SendNotificationAsync(
                            pos.RaisedBy,
                            NotificationType.COLLAPSE_WARNING,
                            pos.Id!,
                            $"URGENT: Position '{pos.JobTitle}' has been inactive for {inactivityDays} days and will collapse in 10 days."
                        );
                    }
                }
                // Day 150: Collapse warning
                else if (inactivityDays >= 150)
                {
                    var recentWarning = await _notificationRepo.FindAsync(n =>
                        n.RecipientId == pos.RaisedBy &&
                        n.PositionId == pos.Id &&
                        n.Type == NotificationType.COLLAPSE_WARNING &&
                        n.CreatedAt > DateTime.UtcNow.AddDays(-10)); // check if day 150 warning was sent

                    if (!recentWarning.Any())
                    {
                        await _notificationService.SendNotificationAsync(
                            pos.RaisedBy,
                            NotificationType.COLLAPSE_WARNING,
                            pos.Id!,
                            $"Position '{pos.JobTitle}' has been inactive for 150 days. It will auto-collapse at 180 days."
                        );
                    }
                }
            }
        }
    }
}
