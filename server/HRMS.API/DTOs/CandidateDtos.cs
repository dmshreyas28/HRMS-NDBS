using System;
using HRMS.API.Models;

namespace HRMS.API.DTOs
{
    public class CreateCandidateRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public CandidateSource Source { get; set; }
        public string CvFileUrl { get; set; } = null!;
    }

    public class UpdateCandidateRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public CandidateSource Source { get; set; }
    }

    public class UpdateCandidateStageRequest
    {
        public CandidateStage Stage { get; set; }
        public string Notes { get; set; } = null!;
    }

    public class AddFeedbackRequest
    {
        public string Stage { get; set; } = null!;
        public string Interviewer { get; set; } = null!;
        public int Rating { get; set; }
        public string Feedback { get; set; } = null!;
    }

    public class SetOfferRequest
    {
        public decimal Salary { get; set; }
        public DateTime StartDate { get; set; }
        public OfferLetterStatus OfferLetterStatus { get; set; }
    }
}
