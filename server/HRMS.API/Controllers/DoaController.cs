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
    [Route("api/doa")]
    [Authorize]
    public class DoaController : ControllerBase
    {
        private readonly IDoAEntryRepository _doaEntryRepo;

        public DoaController(IDoAEntryRepository doaEntryRepo)
        {
            _doaEntryRepo = doaEntryRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var entries = await _doaEntryRepo.GetAllAsync();
            return Ok(ApiResponse<List<DoAEntry>>.Ok(entries));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var entry = await _doaEntryRepo.GetByIdAsync(id);
            if (entry == null)
                return NotFound(ApiResponse.Fail("DoA entry not found."));
            return Ok(ApiResponse<DoAEntry>.Ok(entry));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] DoAEntryRequest request)
        {
            var entry = new DoAEntry
            {
                Name = request.Name,
                Email = request.Email,
                Title = request.Title,
                IsActive = request.IsActive
            };

            await _doaEntryRepo.CreateAsync(entry);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, ApiResponse<DoAEntry>.Ok(entry));
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] DoAEntryRequest request)
        {
            var entry = await _doaEntryRepo.GetByIdAsync(id);
            if (entry == null)
                return NotFound(ApiResponse.Fail("DoA entry not found."));

            entry.Name = request.Name;
            entry.Email = request.Email;
            entry.Title = request.Title;
            entry.IsActive = request.IsActive;

            await _doaEntryRepo.UpdateAsync(id, entry);
            return Ok(ApiResponse<DoAEntry>.Ok(entry));
        }
    }
}
