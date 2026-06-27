using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public class DoAEntry
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; } = null!;

        [BsonElement("email")]
        public string Email { get; set; } = null!;

        [BsonElement("title")]
        public string Title { get; set; } = null!;

        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
