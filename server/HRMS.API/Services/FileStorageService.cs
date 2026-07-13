using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using HRMS.API.Configuration;

namespace HRMS.API.Services
{
    public interface IFileStorageService
    {
        /// <summary>
        /// Persists a file stream and returns the public-facing relative URL
        /// (e.g. "/uploads/abc123_cv.pdf") and the stored file name.
        /// </summary>
        Task<(string url, string fileName)> SaveAsync(Stream stream, string originalFileName, string contentType);
    }

    /// <summary>
    /// Stores files on the local filesystem under the configured LocalPath.
    /// Swap this for an Azure Blob implementation later without touching callers.
    /// </summary>
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _root;
        private readonly ILogger<LocalFileStorageService> _logger;

        public LocalFileStorageService(IOptions<FileStorageSettings> opts, IWebHostEnvironment env, ILogger<LocalFileStorageService> logger)
        {
            _logger = logger;
            var localPath = opts.Value.LocalPath;
            // Resolve relative paths against ContentRootPath so the upload folder
            // is always predictable regardless of the working directory.
            _root = Path.IsPathRooted(localPath)
                ? localPath
                : Path.Combine(env.ContentRootPath, localPath);
            Directory.CreateDirectory(_root);
        }

        public async Task<(string url, string fileName)> SaveAsync(Stream stream, string originalFileName, string contentType)
        {
            var safeName = Path.GetFileName(originalFileName);
            var unique = $"{Guid.NewGuid():N}_{safeName}";
            var fullPath = Path.Combine(_root, unique);

            await using var fs = File.Create(fullPath);
            await stream.CopyToAsync(fs);

            var url = $"/uploads/{unique}";
            _logger.LogInformation("Saved file {File} -> {Url}", unique, url);
            return (url, unique);
        }
    }
}
