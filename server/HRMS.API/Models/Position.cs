using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public enum PositionType
    {
        NEW_HIRE,
        REPLACEMENT
    }

    public enum PositionStatus
    {
        DRAFT,
        PENDING_APPROVAL,
        APPROVED,
        REJECTED,
        ON_HOLD,
        POSTED,
        FILLED,
        COLLAPSED
    }

    public enum ColourCode
    {
        GREEN,
        RED,
        BLACK
    }

    public class SalaryRange
    {
        [BsonElement("min")]
        public decimal Min { get; set; }

        [BsonElement("max")]
        public decimal Max { get; set; }

        [BsonElement("currency")]
        public string Currency { get; set; } = "INR";
    }

    public class OnHoldDetails
    {
        [BsonElement("isOnHold")]
        public bool IsOnHold { get; set; }

        [BsonElement("heldAt")]
        public DateTime? HeldAt { get; set; }

        [BsonElement("expiresAt")]
        public DateTime? ExpiresAt { get; set; }
    }

    public class ReplacementDetails
    {
        [BsonElement("exEmployeeId")]
        public string ExEmployeeId { get; set; } = null!;

        [BsonElement("exEmployeeName")]
        public string ExEmployeeName { get; set; } = null!;

        [BsonElement("exEmployeeEmail")]
        public string ExEmployeeEmail { get; set; } = null!;

        [BsonElement("exEmployeePhone")]
        public string ExEmployeePhone { get; set; } = null!;

        [BsonElement("bu")]
        public string Bu { get; set; } = null!;

        [BsonElement("department")]
        public string Department { get; set; } = null!;

        [BsonElement("lastSalary")]
        public decimal LastSalary { get; set; }

        [BsonElement("reasonForLeaving")]
        public string ReasonForLeaving { get; set; } = null!;

        [BsonElement("colourCode")]
        [BsonRepresentation(BsonType.String)]
        public ColourCode ColourCode { get; set; }
    }

    public class AuditLogEntry
    {
        [BsonElement("action")]
        public string Action { get; set; } = null!;

        [BsonElement("actorId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ActorId { get; set; } = null!;

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonElement("fromStatus")]
        public string FromStatus { get; set; } = null!;

        [BsonElement("toStatus")]
        public string ToStatus { get; set; } = null!;

        [BsonElement("notes")]
        public string Notes { get; set; } = null!;
    }

    public class Position
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("positionType")]
        [BsonRepresentation(BsonType.String)]
        public PositionType PositionType { get; set; }

        [BsonElement("status")]
        [BsonRepresentation(BsonType.String)]
        public PositionStatus Status { get; set; } = PositionStatus.DRAFT;

        [BsonElement("costCentre")]
        public string CostCentre { get; set; } = null!;

        [BsonElement("jobCode")]
        public string JobCode { get; set; } = null!;

        [BsonElement("division")]
        public string Division { get; set; } = null!;

        [BsonElement("jobTitle")]
        public string JobTitle { get; set; } = null!;

        [BsonElement("reportingManager")]
        public string ReportingManager { get; set; } = null!;

        [BsonElement("jd")]
        public string Jd { get; set; } = null!;

        [BsonElement("requiredSkills")]
        public List<string> RequiredSkills { get; set; } = new();

        [BsonElement("salaryRange")]
        public SalaryRange SalaryRange { get; set; } = new();

        [BsonElement("requiredStartDate")]
        public DateTime RequiredStartDate { get; set; }

        [BsonElement("shiftTime")]
        public string ShiftTime { get; set; } = null!;

        [BsonElement("shiftDays")]
        public List<string> ShiftDays { get; set; } = new();

        [BsonElement("location")]
        public string Location { get; set; } = null!;

        [BsonElement("experienceLevel")]
        public string ExperienceLevel { get; set; } = null!;

        [BsonElement("impactIfUnfilled")]
        public string ImpactIfUnfilled { get; set; } = null!;

        [BsonElement("sittingPlace")]
        public string SittingPlace { get; set; } = null!;

        [BsonElement("raisedBy")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string RaisedBy { get; set; } = null!;

        [BsonElement("reviewerId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? ReviewerId { get; set; }

        [BsonElement("reviewerEmailDraft")]
        public string? ReviewerEmailDraft { get; set; }

        [BsonElement("reviewerEmailSent")]
        public bool ReviewerEmailSent { get; set; }

        [BsonElement("approvalSkipped")]
        public bool ApprovalSkipped { get; set; }

        [BsonElement("approvalSkippedReason")]
        public string? ApprovalSkippedReason { get; set; }

        [BsonElement("onHold")]
        public OnHoldDetails OnHold { get; set; } = new();

        [BsonElement("replacementDetails")]
        public ReplacementDetails? ReplacementDetails { get; set; }

        [BsonElement("mrfTemplateId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? MrfTemplateId { get; set; }

        [BsonElement("jobPostedAt")]
        public DateTime? JobPostedAt { get; set; }

        [BsonElement("filledAt")]
        public DateTime? FilledAt { get; set; }

        [BsonElement("collapsedAt")]
        public DateTime? CollapsedAt { get; set; }

        [BsonElement("lastHMActionAt")]
        public DateTime LastHMActionAt { get; set; } = DateTime.UtcNow;

        [BsonElement("auditLog")]
        public List<AuditLogEntry> AuditLog { get; set; } = new();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
