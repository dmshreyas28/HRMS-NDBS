using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public class TemplateSalaryRange
    {
        [BsonElement("min")]
        public decimal Min { get; set; }

        [BsonElement("max")]
        public decimal Max { get; set; }
    }

    public class MrfTemplate
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("costCentre")]
        public string CostCentre { get; set; } = null!;

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("jobTitle")]
        public string JobTitle { get; set; } = null!;

        [BsonElement("jdSkeleton")]
        public string JdSkeleton { get; set; } = null!;

        [BsonElement("requiredSkills")]
        public List<string> RequiredSkills { get; set; } = new();

        [BsonElement("salaryRange")]
        public TemplateSalaryRange SalaryRange { get; set; } = new();

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
