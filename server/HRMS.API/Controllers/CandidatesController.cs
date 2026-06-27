using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Services;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/positions/{positionId}/[controller]")]
    [Authorize]
    public class CandidatesController : ControllerBase
    {
        private readonly ICandidateService _candidateService;

        public CandidatesController(ICandidateService candidateService)
        {
            _candidateService = candidateService;
        }

        private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? throw new UnauthorizedAccessException("User identifier missing.");

        [HttpGet]
        public async Task<IActionResult> GetCandidates(string positionId)
        {
            var candidates = await _candidateService.GetCandidatesByPositionIdAsync(positionId);
            return Ok(ApiResponse<List<Candidate>>.Ok(candidates));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string positionId, string id)
        {
            var candidate = await _candidateService.GetByIdAsync(id);
            return Ok(ApiResponse<Candidate>.Ok(candidate));
        }

        [HttpPost]
        public async Task<IActionResult> Create(string positionId, [FromBody] CreateCandidateRequest request)
        {
            var candidate = await _candidateService.CreateCandidateAsync(positionId, request);
            return CreatedAtAction(nameof(GetById), new { positionId, id = candidate.Id }, ApiResponse<Candidate>.Ok(candidate));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(string positionId, string id, [FromBody] UpdateCandidateRequest request)
        {
            var candidate = await _candidateService.UpdateCandidateAsync(id, request);
            return Ok(ApiResponse<Candidate>.Ok(candidate));
        }

        [HttpPatch("{id}/stage")]
        public async Task<IActionResult> TransitionStage(string positionId, string id, [FromBody] UpdateCandidateStageRequest request)
        {
            var candidate = await _candidateService.TransitionStageAsync(id, request, CurrentUserId);
            return Ok(ApiResponse<Candidate>.Ok(candidate));
        }

        [HttpPost("{id}/feedback")]
        public async Task<IActionResult> AddFeedback(string positionId, string id, [FromBody] AddFeedbackRequest request)
        {
            var candidate = await _candidateService.AddFeedbackAsync(id, request);
            return Ok(ApiResponse<Candidate>.Ok(candidate));
        }

        [HttpPost("{id}/offer")]
        public async Task<IActionResult> SetOffer(string positionId, string id, [FromBody] SetOfferRequest request)
        {
            var candidate = await _candidateService.SetOfferAsync(id, request);
            return Ok(ApiResponse<Candidate>.Ok(candidate));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string positionId, string id)
        {
            await _candidateService.DeleteCandidateAsync(id);
            return Ok(ApiResponse.Ok());
        }

        [HttpPost("{id}/cv")]
        public async Task<IActionResult> UploadCv(string positionId, string id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(ApiResponse.Fail("No file uploaded."));

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{fileName}";

            var candidate = await _candidateService.UpdateCvUrlAsync(id, fileUrl);
            return Ok(ApiResponse<Candidate>.Ok(candidate));
        }
    }
}
