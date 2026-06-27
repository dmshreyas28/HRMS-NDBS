using System.Collections.Generic;
using HRMS.API.Models;

namespace HRMS.API.DTOs
{
    public class UserUpdateRequest
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public UserRole Role { get; set; }
        public string? CostCentre { get; set; }
        public string? Department { get; set; }
        public bool IsActive { get; set; }
    }

    public class MrfTemplateRequest
    {
        public string CostCentre { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string JobTitle { get; set; } = null!;
        public string JdSkeleton { get; set; } = null!;
        public List<string> RequiredSkills { get; set; } = new();
        public decimal MinSalary { get; set; }
        public decimal MaxSalary { get; set; }
        public bool IsActive { get; set; }
    }

    public class CostCentreRequest
    {
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Department { get; set; } = null!;
        public bool IsActive { get; set; }
    }

    public class DoAEntryRequest
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Title { get; set; } = null!;
        public bool IsActive { get; set; }
    }
}
