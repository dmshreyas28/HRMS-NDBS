using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using HRMS.API.Models;
using HRMS.API.Repositories;

namespace HRMS.API.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(string recipientId, NotificationType type, string positionId, string message, NotificationChannel channel = NotificationChannel.IN_APP);
        Task<List<Notification>> GetUserNotificationsAsync(string userId);
        Task MarkAsReadAsync(string notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;
        private readonly IUserRepository _userRepo;

        public NotificationService(INotificationRepository notificationRepo, IUserRepository userRepo)
        {
            _notificationRepo = notificationRepo;
            _userRepo = userRepo;
        }

        public async Task SendNotificationAsync(string recipientId, NotificationType type, string positionId, string message, NotificationChannel channel = NotificationChannel.IN_APP)
        {
            if (recipientId == "hr_ta_group")
            {
                var taUsers = await _userRepo.FindAsync(u => u.Role == UserRole.HR_TA && u.IsActive);
                foreach (var user in taUsers)
                {
                    if (!string.IsNullOrEmpty(user.Id))
                    {
                        await SendIndividualNotificationAsync(user.Id, type, positionId, message, channel);
                    }
                }
            }
            else if (recipientId == "admin_group")
            {
                var admins = await _userRepo.FindAsync(u => u.Role == UserRole.Admin && u.IsActive);
                foreach (var user in admins)
                {
                    if (!string.IsNullOrEmpty(user.Id))
                    {
                        await SendIndividualNotificationAsync(user.Id, type, positionId, message, channel);
                    }
                }
            }
            else
            {
                await SendIndividualNotificationAsync(recipientId, type, positionId, message, channel);
            }
        }

        private async Task SendIndividualNotificationAsync(string recipientId, NotificationType type, string positionId, string message, NotificationChannel channel)
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

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId)
        {
            return await _notificationRepo.FindAsync(n => n.RecipientId == userId);
        }

        public async Task MarkAsReadAsync(string notificationId, string userId)
        {
            var notification = await _notificationRepo.GetByIdAsync(notificationId);
            if (notification != null && notification.RecipientId == userId)
            {
                notification.IsRead = true;
                await _notificationRepo.UpdateAsync(notificationId, notification);
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            var notifications = await _notificationRepo.FindAsync(n => n.RecipientId == userId && !n.IsRead);
            foreach (var n in notifications)
            {
                n.IsRead = true;
                await _notificationRepo.UpdateAsync(n.Id!, n);
            }
        }
    }
}
