using System;
using FluentValidation;
using HRMS.API.DTOs;
using HRMS.API.Models;

namespace HRMS.API.Validators
{
    public class SalaryRangeDtoValidator : AbstractValidator<SalaryRangeDto>
    {
        public SalaryRangeDtoValidator()
        {
            RuleFor(x => x.Min).GreaterThanOrEqualTo(0).WithMessage("Minimum salary must be greater than or equal to 0.");
            RuleFor(x => x.Max).GreaterThanOrEqualTo(x => x.Min).WithMessage("Maximum salary must be greater than or equal to minimum salary.");
            RuleFor(x => x.Currency).NotEmpty().WithMessage("Currency is required.");
        }
    }

    public class ReplacementDetailsDtoValidator : AbstractValidator<ReplacementDetailsDto>
    {
        public ReplacementDetailsDtoValidator()
        {
            RuleFor(x => x.ExEmployeeId).NotEmpty().WithMessage("Ex-employee ID is required.");
            RuleFor(x => x.ExEmployeeName).NotEmpty().WithMessage("Ex-employee name is required.");
            RuleFor(x => x.ExEmployeeEmail).NotEmpty().EmailAddress().WithMessage("A valid ex-employee email is required.");
            RuleFor(x => x.ExEmployeePhone).NotEmpty().WithMessage("Ex-employee phone number is required.");
            RuleFor(x => x.Bu).NotEmpty().WithMessage("Business unit (BU) is required.");
            RuleFor(x => x.Department).NotEmpty().WithMessage("Department is required.");
            RuleFor(x => x.LastSalary).GreaterThanOrEqualTo(0).WithMessage("Last salary must be greater than or equal to 0.");
            RuleFor(x => x.ReasonForLeaving).NotEmpty().WithMessage("Reason for leaving is required.");
            RuleFor(x => x.ColourCode).IsInEnum().WithMessage("A valid color code is required.");
        }
    }

    public class CreatePositionRequestValidator : AbstractValidator<CreatePositionRequest>
    {
        public CreatePositionRequestValidator()
        {
            RuleFor(x => x.PositionType).IsInEnum().WithMessage("Position type is invalid.");

            RuleFor(x => x.ReplacementDetails)
                .NotNull().When(x => x.PositionType == PositionType.REPLACEMENT)
                .WithMessage("Replacement details are required for replacement position type.");

            RuleFor(x => x.ReplacementDetails!)
                .SetValidator(new ReplacementDetailsDtoValidator())
                .When(x => x.PositionType == PositionType.REPLACEMENT && x.ReplacementDetails != null);

            RuleFor(x => x.ApprovalSkippedReason)
                .NotEmpty().When(x => x.ApprovalSkipped)
                .WithMessage("Approval skipped reason is required when approval is skipped.");
        }
    }

    public class UpdatePositionRequestValidator : AbstractValidator<UpdatePositionRequest>
    {
        public UpdatePositionRequestValidator()
        {
            RuleFor(x => x.SalaryRange).SetValidator(new SalaryRangeDtoValidator());

            RuleFor(x => x.ReplacementDetails!)
                .SetValidator(new ReplacementDetailsDtoValidator())
                .When(x => x.ReplacementDetails != null);
        }
    }

    public class CreateCandidateRequestValidator : AbstractValidator<CreateCandidateRequest>
    {
        public CreateCandidateRequestValidator()
        {
            RuleFor(x => x.FullName).NotEmpty().WithMessage("Full name is required.");
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email address is required.");
            RuleFor(x => x.Phone).NotEmpty().WithMessage("Phone number is required.");
            RuleFor(x => x.Source).IsInEnum().WithMessage("Invalid candidate source.");
            RuleFor(x => x.CvFileUrl).NotEmpty().WithMessage("CV file URL is required.");
        }
    }

    public class UpdateCandidateRequestValidator : AbstractValidator<UpdateCandidateRequest>
    {
        public UpdateCandidateRequestValidator()
        {
            RuleFor(x => x.FullName).NotEmpty().WithMessage("Full name is required.");
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email address is required.");
            RuleFor(x => x.Phone).NotEmpty().WithMessage("Phone number is required.");
            RuleFor(x => x.Source).IsInEnum().WithMessage("Invalid candidate source.");
        }
    }

    public class UpdateCandidateStageRequestValidator : AbstractValidator<UpdateCandidateStageRequest>
    {
        public UpdateCandidateStageRequestValidator()
        {
            RuleFor(x => x.Stage).IsInEnum().WithMessage("Invalid candidate stage.");
            RuleFor(x => x.Notes).NotEmpty().WithMessage("Notes are required for stage changes.");
        }
    }

    public class AddFeedbackRequestValidator : AbstractValidator<AddFeedbackRequest>
    {
        public AddFeedbackRequestValidator()
        {
            RuleFor(x => x.Stage).NotEmpty().WithMessage("Stage is required.");
            RuleFor(x => x.Interviewer).NotEmpty().WithMessage("Interviewer name is required.");
            RuleFor(x => x.Rating).InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");
            RuleFor(x => x.Feedback).NotEmpty().WithMessage("Feedback comments are required.");
        }
    }

    public class SetOfferRequestValidator : AbstractValidator<SetOfferRequest>
    {
        public SetOfferRequestValidator()
        {
            RuleFor(x => x.Salary).GreaterThanOrEqualTo(0).WithMessage("Salary must be greater than or equal to 0.");
            RuleFor(x => x.StartDate).GreaterThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Offer start date cannot be in the past.");
            RuleFor(x => x.OfferLetterStatus).IsInEnum().WithMessage("Invalid offer letter status.");
        }
    }
}
