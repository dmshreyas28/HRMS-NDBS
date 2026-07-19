using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRMS.API.DTOs;
using HRMS.API.Models;
using HRMS.API.Services;
using HRMS.API.Repositories;

namespace HRMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : BaseController
    {
        private readonly NotificationService _notificationService;
        private readonly IUserRepository _userRepo;

        public NotificationsController(NotificationService notificationService, IUserRepository userRepo)
        {
            _notificationService = notificationService;
            _userRepo = userRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserNotifications()
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);
            var notifications = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(ApiResponse<List<Notification>>.Ok(notifications));
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);
            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(ApiResponse.Ok());
        }

        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = await GetCurrentMongoUserIdAsync(_userRepo);
            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(ApiResponse.Ok());
        }
    }
}
