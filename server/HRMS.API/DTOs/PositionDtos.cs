using System;
using System.Collections.Generic;
using HRMS.API.Models;

namespace HRMS.API.DTOs
{
    public class SalaryRangeDto
    {
        public decimal Min { get; set; }
        public decimal Max { get; set; }
        public string Currency { get; set; } = "INR";
    }

    public class ReplacementDetailsDto
    {
        public string ExEmployeeId { get; set; } = null!;
        public string ExEmployeeName { get; set; } = null!;
        public string ExEmployeeEmail { get; set; } = null!;
        public string ExEmployeePhone { get; set; } = null!;
        public string Bu { get; set; } = null!;
        public string Department { get; set; } = null!;
        public decimal LastSalary { get; set; }
        public string ReasonForLeaving { get; set; } = null!;
        public ColourCode ColourCode { get; set; }
    }

    public class CreatePositionRequest
    {
        public PositionType PositionType { get; set; }
        public string CostCentre { get; set; } = null!;
        public string JobCode { get; set; } = null!;
        public string Division { get; set; } = null!;
        public string JobTitle { get; set; } = null!;
        public string ReportingManager { get; set; } = null!;
        public string Jd { get; set; } = null!;
        public List<string> RequiredSkills { get; set; } = new();
        public SalaryRangeDto SalaryRange { get; set; } = new();
        public DateTime RequiredStartDate { get; set; }
        public string ShiftTime { get; set; } = null!;
        public List<string> ShiftDays { get; set; } = new();
        public string Location { get; set; } = null!;
        public string ExperienceLevel { get; set; } = null!;
        public string ImpactIfUnfilled { get; set; } = null!;
        public string SittingPlace { get; set; } = null!;
        public string? ReviewerId { get; set; }
        public bool ApprovalSkipped { get; set; }
        public string? ApprovalSkippedReason { get; set; }
        public ReplacementDetailsDto? ReplacementDetails { get; set; }
        public string MrfTemplateId { get; set; } = null!;
    }

    public class UpdatePositionRequest
    {
        public string CostCentre { get; set; } = null!;
        public string Division { get; set; } = null!;
        public string JobTitle { get; set; } = null!;
        public string ReportingManager { get; set; } = null!;
        public string Jd { get; set; } = null!;
        public List<string> RequiredSkills { get; set; } = new();
        public SalaryRangeDto SalaryRange { get; set; } = new();
        public DateTime RequiredStartDate { get; set; }
        public string ShiftTime { get; set; } = null!;
        public List<string> ShiftDays { get; set; } = new();
        public string Location { get; set; } = null!;
        public string ExperienceLevel { get; set; } = null!;
        public string ImpactIfUnfilled { get; set; } = null!;
        public string SittingPlace { get; set; } = null!;
        public string? ReviewerId { get; set; }
        public ReplacementDetailsDto? ReplacementDetails { get; set; }
    }

    public class SubmitPositionRequest
    {
        public string ReviewerId { get; set; } = null!;
        public bool ApprovalSkipped { get; set; }
        public string? ApprovalSkippedReason { get; set; }
    }

    public class ApprovePositionRequest
    {
        public string Notes { get; set; } = null!;
    }

    public class RejectPositionRequest
    {
        public string Reason { get; set; } = null!;
    }

    public class HoldPositionRequest
    {
        public int DurationDays { get; set; }
    }
}
