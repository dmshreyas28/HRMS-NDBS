using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public class CostCentre
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("code")]
        public string Code { get; set; } = null!;

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("department")]
        public string Department { get; set; } = null!;

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
