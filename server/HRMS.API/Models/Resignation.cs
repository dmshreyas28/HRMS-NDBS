using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public class Resignation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("employeeId")]
        public string EmployeeId { get; set; } = null!;

        [BsonElement("employeeName")]
        public string EmployeeName { get; set; } = null!;

        [BsonElement("employeeEmail")]
        public string EmployeeEmail { get; set; } = null!;

        [BsonElement("employeePhone")]
        public string EmployeePhone { get; set; } = null!;

        [BsonElement("bu")]
        public string Bu { get; set; } = null!;

        [BsonElement("department")]
        public string Department { get; set; } = null!;

        [BsonElement("lastSalary")]
        public decimal LastSalary { get; set; }

        [BsonElement("managerId")]
        public string ManagerId { get; set; } = null!; // The HM who is direct manager of this employee

        [BsonElement("status")]
        public string Status { get; set; } = "PENDING_ACTION"; // PENDING_ACTION, REPLACED, NO_REPLACEMENT

        [BsonElement("reasonForLeaving")]
        public string? ReasonForLeaving { get; set; }

        [BsonElement("colourCode")]
        [BsonRepresentation(BsonType.String)]
        public ColourCode? ColourCode { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
