using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/mrf-templates")]
    [Authorize]
    public class MrfTemplatesController : ControllerBase
    {
        private readonly IMrfTemplateRepository _mrfTemplateRepo;

        public MrfTemplatesController(IMrfTemplateRepository mrfTemplateRepo)
        {
            _mrfTemplateRepo = mrfTemplateRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var templates = await _mrfTemplateRepo.GetAllAsync();
            return Ok(ApiResponse<List<MrfTemplate>>.Ok(templates));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var template = await _mrfTemplateRepo.GetByIdAsync(id);
            if (template == null)
                return NotFound(ApiResponse.Fail("Template not found."));
            return Ok(ApiResponse<MrfTemplate>.Ok(template));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] MrfTemplateRequest request)
        {
            var template = new MrfTemplate
            {
                CostCentre = request.CostCentre,
                Name = request.Name,
                JobTitle = request.JobTitle,
                JdSkeleton = request.JdSkeleton,
                RequiredSkills = request.RequiredSkills,
                SalaryRange = new TemplateSalaryRange
                {
                    Min = request.MinSalary,
                    Max = request.MaxSalary
                },
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            await _mrfTemplateRepo.CreateAsync(template);
            return CreatedAtAction(nameof(GetById), new { id = template.Id }, ApiResponse<MrfTemplate>.Ok(template));
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] MrfTemplateRequest request)
        {
            var template = await _mrfTemplateRepo.GetByIdAsync(id);
            if (template == null)
                return NotFound(ApiResponse.Fail("Template not found."));

            template.CostCentre = request.CostCentre;
            template.Name = request.Name;
            template.JobTitle = request.JobTitle;
            template.JdSkeleton = request.JdSkeleton;
            template.RequiredSkills = request.RequiredSkills;
            template.SalaryRange.Min = request.MinSalary;
            template.SalaryRange.Max = request.MaxSalary;
            template.IsActive = request.IsActive;

            await _mrfTemplateRepo.UpdateAsync(id, template);
            return Ok(ApiResponse<MrfTemplate>.Ok(template));
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Delete(string id)
        {
            var template = await _mrfTemplateRepo.GetByIdAsync(id);
            if (template == null)
                return NotFound(ApiResponse.Fail("Template not found."));

            template.IsActive = false;
            await _mrfTemplateRepo.UpdateAsync(id, template);
            return Ok(ApiResponse.Ok());
        }
    }
}
