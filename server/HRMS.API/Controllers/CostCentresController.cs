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
    [Route("api/cost-centres")]
    [Authorize]
    public class CostCentresController : ControllerBase
    {
        private readonly ICostCentreRepository _costCentreRepo;

        public CostCentresController(ICostCentreRepository costCentreRepo)
        {
            _costCentreRepo = costCentreRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var costCentres = await _costCentreRepo.GetAllAsync();
            return Ok(ApiResponse<List<CostCentre>>.Ok(costCentres));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var costCentre = await _costCentreRepo.GetByIdAsync(id);
            if (costCentre == null)
                return NotFound(ApiResponse.Fail("Cost centre not found."));
            return Ok(ApiResponse<CostCentre>.Ok(costCentre));
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Create([FromBody] CostCentreRequest request)
        {
            var costCentre = new CostCentre
            {
                Code = request.Code,
                Name = request.Name,
                Department = request.Department,
                IsActive = request.IsActive
            };

            await _costCentreRepo.CreateAsync(costCentre);
            return CreatedAtAction(nameof(GetById), new { id = costCentre.Id }, ApiResponse<CostCentre>.Ok(costCentre));
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> Update(string id, [FromBody] CostCentreRequest request)
        {
            var costCentre = await _costCentreRepo.GetByIdAsync(id);
            if (costCentre == null)
                return NotFound(ApiResponse.Fail("Cost centre not found."));

            costCentre.Code = request.Code;
            costCentre.Name = request.Name;
            costCentre.Department = request.Department;
            costCentre.IsActive = request.IsActive;

            await _costCentreRepo.UpdateAsync(id, costCentre);
            return Ok(ApiResponse<CostCentre>.Ok(costCentre));
        }
    }
}
