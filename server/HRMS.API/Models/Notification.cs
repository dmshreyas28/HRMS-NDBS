using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace HRMS.API.Models
{
    public enum NotificationType
    {
        APPROVAL_REMINDER,
        JOB_NOT_POSTED,
        POSITION_HOLD_EXPIRY,
        COLLAPSE_WARNING,
        POSITION_COLLAPSED,
        RESIGNATION_ACTION,
        POSITION_APPROVED,
        POSITION_REJECTED,
        POSITION_FILLED
    }

    public enum NotificationChannel
    {
        IN_APP,
        EMAIL
    }

    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("recipientId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string RecipientId { get; set; } = null!;

        [BsonElement("type")]
        [BsonRepresentation(BsonType.String)]
        public NotificationType Type { get; set; }

        [BsonElement("positionId")]
        public string? PositionId { get; set; }

        [BsonElement("message")]
        public string Message { get; set; } = null!;

        [BsonElement("isRead")]
        public bool IsRead { get; set; } = false;

        [BsonElement("channel")]
        [BsonRepresentation(BsonType.String)]
        public NotificationChannel Channel { get; set; }

        [BsonElement("sentAt")]
        public DateTime? SentAt { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
