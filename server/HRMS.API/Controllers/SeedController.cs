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
    [Route("api/admin/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly CostCentreRepository _costCentreRepo;
        private readonly MrfTemplateRepository _mrfTemplateRepo;
        private readonly DoAEntryRepository _doaRepo;
        private readonly NotificationRepository _notificationRepo;

        public SeedController(
            CostCentreRepository costCentreRepo,
            MrfTemplateRepository mrfTemplateRepo,
            DoAEntryRepository doaRepo,
            NotificationRepository notificationRepo)
        {
            _costCentreRepo = costCentreRepo;
            _mrfTemplateRepo = mrfTemplateRepo;
            _doaRepo = doaRepo;
            _notificationRepo = notificationRepo;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> SeedDatabase()
        {
            try
            {
                // Clear existing cost centres
                var existingCostCentres = await _costCentreRepo.GetAllAsync();
                foreach (var cc in existingCostCentres)
                {
                    await _costCentreRepo.DeleteAsync(cc.Id!);
                }

                // Clear existing templates
                var existingTemplates = await _mrfTemplateRepo.GetAllAsync();
                foreach (var t in existingTemplates)
                {
                    await _mrfTemplateRepo.DeleteAsync(t.Id!);
                }

                // Clear existing DoA
                var existingDoa = await _doaRepo.GetAllAsync();
                foreach (var d in existingDoa)
                {
                    await _doaRepo.DeleteAsync(d.Id!);
                }

                // 1. Seed Cost Centres
                var costCentres = new List<CostCentre>
                {
                    new() { Code = "CC-001", Name = "Engineering", Department = "Technology", IsActive = true },
                    new() { Code = "CC-002", Name = "Marketing", Department = "Growth", IsActive = true },
                    new() { Code = "CC-003", Name = "Operations", Department = "Operations", IsActive = true },
                    new() { Code = "CC-004", Name = "Finance", Department = "Finance", IsActive = true },
                    new() { Code = "CC-005", Name = "Human Resources", Department = "People", IsActive = true }
                };

                foreach (var cc in costCentres)
                {
                    await _costCentreRepo.CreateAsync(cc);
                }

                // 2. Seed MRF Templates
                var templates = new List<MrfTemplate>
                {
                    new()
                    {
                        CostCentre = "CC-001",
                        Name = "Software Engineer Template",
                        JobTitle = "Software Engineer",
                        JdSkeleton = "We are looking for a Software Engineer to join our team. Responsibilities include designing, developing, and maintaining software systems. You will work with cross-functional teams to deliver high-quality products.",
                        RequiredSkills = new List<string> { "JavaScript", "React", "Node.js", "REST APIs", "Git" },
                        SalaryRange = new TemplateSalaryRange { Min = 600000, Max = 1200000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-001",
                        Name = "Senior Software Engineer Template",
                        JobTitle = "Senior Software Engineer",
                        JdSkeleton = "We are looking for a Senior Software Engineer with 5+ years of experience. You will lead technical design, mentor junior engineers, and own complex features end-to-end.",
                        RequiredSkills = new List<string> { "System Design", "JavaScript", "React", "C#", "MongoDB", "AWS" },
                        SalaryRange = new TemplateSalaryRange { Min = 1200000, Max = 2200000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-002",
                        Name = "Marketing Manager Template",
                        JobTitle = "Marketing Manager",
                        JdSkeleton = "We are looking for a Marketing Manager to lead our marketing initiatives. Responsibilities include campaign strategy, execution, performance tracking, and team management.",
                        RequiredSkills = new List<string> { "Digital Marketing", "SEO/SEM", "Analytics", "Content Strategy", "Team Leadership" },
                        SalaryRange = new TemplateSalaryRange { Min = 800000, Max = 1500000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-003",
                        Name = "Operations Analyst Template",
                        JobTitle = "Operations Analyst",
                        JdSkeleton = "We are looking for an Operations Analyst to streamline business processes, analyse operational data, and support cross-functional projects.",
                        RequiredSkills = new List<string> { "Process Analysis", "Excel", "Data Analysis", "Project Management", "Reporting" },
                        SalaryRange = new TemplateSalaryRange { Min = 500000, Max = 900000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-005",
                        Name = "HR Business Partner Template",
                        JobTitle = "HR Business Partner",
                        JdSkeleton = "We are looking for an HRBP to act as a strategic partner to business leaders. Responsibilities include talent management, employee relations, performance management, and HR policy implementation.",
                        RequiredSkills = new List<string> { "Employee Relations", "Talent Management", "HRMS Tools", "Labour Law", "Communication" },
                        SalaryRange = new TemplateSalaryRange { Min = 700000, Max = 1300000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-004",
                        Name = "Finance Analyst Template",
                        JobTitle = "Finance Analyst",
                        JdSkeleton = "We are looking for a Finance Analyst to join our team. You will be responsible for budgeting, financial forecasting, and operational performance analysis.",
                        RequiredSkills = new List<string> { "Financial Modeling", "Excel", "SQL", "Budgeting", "Forecasting" },
                        SalaryRange = new TemplateSalaryRange { Min = 600000, Max = 1100000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-001",
                        Name = "Product Manager Template",
                        JobTitle = "Product Manager",
                        JdSkeleton = "We are looking for a Product Manager to own product features from concept to launch. You will collaborate with engineering, design, and marketing to define product requirements and deliver value to our customers.",
                        RequiredSkills = new List<string> { "Product Strategy", "Agile", "User Research", "Roadmapping", "Data Analytics" },
                        SalaryRange = new TemplateSalaryRange { Min = 1000000, Max = 1800000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-001",
                        Name = "QA Engineer Template",
                        JobTitle = "QA Engineer",
                        JdSkeleton = "We are looking for a QA Engineer to design and execute test cases, identify bugs, and automate regression tests to ensure high-quality software releases.",
                        RequiredSkills = new List<string> { "Selenium", "Test Automation", "Manual Testing", "REST API Testing", "SQL" },
                        SalaryRange = new TemplateSalaryRange { Min = 500000, Max = 950000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new()
                    {
                        CostCentre = "CC-002",
                        Name = "Sales Executive Template",
                        JobTitle = "Sales Executive",
                        JdSkeleton = "We are looking for a Sales Executive to drive revenue growth, manage customer relationships, and close new deals.",
                        RequiredSkills = new List<string> { "Negotiation", "B2B Sales", "Lead Generation", "CRM Tools", "Communication" },
                        SalaryRange = new TemplateSalaryRange { Min = 400000, Max = 800000 },
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                foreach (var t in templates)
                {
                    await _mrfTemplateRepo.CreateAsync(t);
                }

                // 3. Seed DoA List
                var doaEntries = new List<DoAEntry>
                {
                    new() { Name = "Priya Sharma", Email = "priya.sharma@hrms.dev", Title = "VP Engineering", IsActive = true },
                    new() { Name = "Rahul Mehta", Email = "rahul.mehta@hrms.dev", Title = "Director Operations", IsActive = true },
                    new() { Name = "Sunita Patel", Email = "sunita.patel@hrms.dev", Title = "CFO", IsActive = true },
                    new() { Name = "Arjun Nair", Email = "arjun.nair@hrms.dev", Title = "CHRO", IsActive = true },
                    new() { Name = "Deepa Krishnan", Email = "deepa.krishnan@hrms.dev", Title = "VP Marketing", IsActive = true }
                };

                foreach (var d in doaEntries)
                {
                    await _doaRepo.CreateAsync(d);
                }

                return Ok(ApiResponse<string>.Ok("Database seeded successfully with Cost Centres, MRF Templates, and DoA list."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail($"Seeding failed: {ex.Message}"));
            }
        }

        [HttpPost("cleanup-notifications")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> CleanupNotifications()
        {
            try
            {
                var bad = await _notificationRepo.FindAsync(n => n.PositionId == "");
                var count = 0;
                foreach (var n in bad)
                {
                    n.PositionId = null;
                    await _notificationRepo.UpdateAsync(n.Id!, n);
                    count++;
                }
                return Ok(ApiResponse<string>.Ok($"Cleaned up {count} notification(s) with empty positionId."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail($"Cleanup failed: {ex.Message}"));
            }
        }
    }
}
