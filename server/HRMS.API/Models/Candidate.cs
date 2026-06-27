using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public enum CandidateSource
    {
        JOB_BOARD,
        REFERRAL,
        DIRECT,
        OTHER
    }

    public enum CandidateStage
    {
        APPLIED,
        SCREENING,
        INTERVIEW_SCHEDULED,
        INTERVIEW_COMPLETED,
        OFFER,
        HIRED,
        REJECTED,
        WITHDRAWN
    }

    public enum OfferLetterStatus
    {
        NOT_SENT,
        SENT,
        ACCEPTED,
        DECLINED
    }

    public class StageHistoryEntry
    {
        [BsonElement("stage")]
        [BsonRepresentation(BsonType.String)]
        public CandidateStage Stage { get; set; }

        [BsonElement("movedAt")]
        public DateTime MovedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("movedBy")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MovedBy { get; set; } = null!;

        [BsonElement("notes")]
        public string Notes { get; set; } = null!;
    }

    public class InterviewFeedbackEntry
    {
        [BsonElement("stage")]
        public string Stage { get; set; } = null!;

        [BsonElement("interviewer")]
        public string Interviewer { get; set; } = null!;

        [BsonElement("rating")]
        public int Rating { get; set; }

        [BsonElement("feedback")]
        public string Feedback { get; set; } = null!;

        [BsonElement("date")]
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }

    public class OfferDetails
    {
        [BsonElement("salary")]
        public decimal Salary { get; set; }

        [BsonElement("startDate")]
        public DateTime StartDate { get; set; }

        [BsonElement("offerLetterStatus")]
        [BsonRepresentation(BsonType.String)]
        public OfferLetterStatus OfferLetterStatus { get; set; } = OfferLetterStatus.NOT_SENT;
    }

    public class Candidate
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("positionId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PositionId { get; set; } = null!;

        [BsonElement("fullName")]
        public string FullName { get; set; } = null!;

        [BsonElement("email")]
        public string Email { get; set; } = null!;

        [BsonElement("phone")]
        public string Phone { get; set; } = null!;

        [BsonElement("source")]
        [BsonRepresentation(BsonType.String)]
        public CandidateSource Source { get; set; }

        [BsonElement("cvFileUrl")]
        public string CvFileUrl { get; set; } = null!;

        [BsonElement("currentStage")]
        [BsonRepresentation(BsonType.String)]
        public CandidateStage CurrentStage { get; set; } = CandidateStage.APPLIED;

        [BsonElement("stageHistory")]
        public List<StageHistoryEntry> StageHistory { get; set; } = new();

        [BsonElement("interviewFeedback")]
        public List<InterviewFeedbackEntry> InterviewFeedback { get; set; } = new();

        [BsonElement("offer")]
        public OfferDetails? Offer { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
