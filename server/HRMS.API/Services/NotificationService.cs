using System;
using System.Threading.Tasks;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(string recipientId, NotificationType type, string positionId, string message, NotificationChannel channel = NotificationChannel.IN_APP);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;

        public NotificationService(INotificationRepository notificationRepo)
        {
            _notificationRepo = notificationRepo;
        }

        public async Task SendNotificationAsync(string recipientId, NotificationType type, string positionId, string message, NotificationChannel channel = NotificationChannel.IN_APP)
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                Type = type,
                PositionId = positionId,
                Message = message,
                Channel = channel,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.CreateAsync(notification);

            if (channel == NotificationChannel.EMAIL)
            {
                // Mock email notification sent to console as per business rules
                Console.WriteLine($"[EMAIL MOCK] To: {recipientId} | Message: {message}");
            }
        }
    }
}
