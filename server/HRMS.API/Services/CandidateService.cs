using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Services
{
    public class CandidateService
    {
        private readonly ICandidateRepository _candidateRepo;
        private readonly PositionService _positionService;

        public CandidateService(
            ICandidateRepository candidateRepo,
            PositionService positionService)
        {
            _candidateRepo = candidateRepo;
            _positionService = positionService;
        }

        public async Task<Candidate> GetByIdAsync(string id)
        {
            var candidate = await _candidateRepo.GetByIdAsync(id);
            if (candidate == null)
                throw new KeyNotFoundException("Candidate not found.");
            return candidate;
        }

        public async Task<List<Candidate>> GetCandidatesByPositionIdAsync(string positionId)
        {
            return await _candidateRepo.FindAsync(c => c.PositionId == positionId);
        }

        public async Task<Candidate> CreateCandidateAsync(string positionId, CreateCandidateRequest request)
        {
            var position = await _positionService.GetByIdAsync(positionId);
            if (position.Status != PositionStatus.POSTED && position.Status != PositionStatus.APPROVED)
                throw new InvalidOperationException("Cannot add candidates to a position that is not approved or posted.");

            var candidate = new Candidate
            {
                PositionId = positionId,
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Source = request.Source,
                CvFileUrl = request.CvFileUrl,
                CurrentStage = CandidateStage.APPLIED,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            candidate.StageHistory.Add(new StageHistoryEntry
            {
                Stage = CandidateStage.APPLIED,
                MovedAt = DateTime.UtcNow,
                MovedBy = position.RaisedBy,
                Notes = "Initial application received."
            });

            await _candidateRepo.CreateAsync(candidate);
            return candidate;
        }

        public async Task<Candidate> UpdateCandidateAsync(string id, UpdateCandidateRequest request)
        {
            var candidate = await GetByIdAsync(id);

            candidate.FullName = request.FullName;
            candidate.Email = request.Email;
            candidate.Phone = request.Phone;
            candidate.Source = request.Source;
            candidate.UpdatedAt = DateTime.UtcNow;

            await _candidateRepo.UpdateAsync(id, candidate);
            return candidate;
        }

        public async Task<Candidate> TransitionStageAsync(string id, UpdateCandidateStageRequest request, string actorUserId)
        {
            var candidate = await GetByIdAsync(id);
            if (candidate.CurrentStage == request.Stage)
                return candidate;

            candidate.CurrentStage = request.Stage;
            candidate.UpdatedAt = DateTime.UtcNow;

            candidate.StageHistory.Add(new StageHistoryEntry
            {
                Stage = request.Stage,
                MovedAt = DateTime.UtcNow,
                MovedBy = actorUserId,
                Notes = request.Notes
            });

            if (request.Stage == CandidateStage.HIRED)
            {
                await _positionService.AutoClosePositionAsync(candidate.PositionId, actorUserId);
            }

            await _candidateRepo.UpdateAsync(id, candidate);
            return candidate;
        }

        public async Task<Candidate> AddFeedbackAsync(string id, AddFeedbackRequest request)
        {
            var candidate = await GetByIdAsync(id);

            candidate.InterviewFeedback.Add(new InterviewFeedbackEntry
            {
                Stage = request.Stage,
                Interviewer = request.Interviewer,
                Rating = request.Rating,
                Feedback = request.Feedback,
                Date = DateTime.UtcNow
            });

            candidate.UpdatedAt = DateTime.UtcNow;
            await _candidateRepo.UpdateAsync(id, candidate);
            return candidate;
        }

        public async Task<Candidate> SetOfferAsync(string id, SetOfferRequest request)
        {
            var candidate = await GetByIdAsync(id);

            candidate.Offer = new OfferDetails
            {
                Salary = request.Salary,
                StartDate = request.StartDate,
                OfferLetterStatus = request.OfferLetterStatus
            };

            candidate.UpdatedAt = DateTime.UtcNow;
            await _candidateRepo.UpdateAsync(id, candidate);
            return candidate;
        }

        public async Task<Candidate> UpdateCvUrlAsync(string id, string cvUrl)
        {
            var candidate = await GetByIdAsync(id);
            candidate.CvFileUrl = cvUrl;
            candidate.UpdatedAt = DateTime.UtcNow;
            await _candidateRepo.UpdateAsync(id, candidate);
            return candidate;
        }

        public async Task DeleteCandidateAsync(string id)
        {
            await _candidateRepo.DeleteAsync(id);
        }
    }
}
