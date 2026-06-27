using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public enum UserRole
    {
        HM,
        HR_TA,
        Admin
    }

    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("auth0Id")]
        public string Auth0Id { get; set; } = null!;

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("email")]
        public string Email { get; set; } = null!;

        [BsonElement("role")]
        [BsonRepresentation(BsonType.String)]
        public UserRole Role { get; set; }

        [BsonElement("costCentre")]
        public string? CostCentre { get; set; }

        [BsonElement("department")]
        public string? Department { get; set; }

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}