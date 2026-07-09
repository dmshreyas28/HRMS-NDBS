namespace HRMS.API.Configuration
{
    public class MongoSettings
    {
        /// <summary>Full MongoDB connection string, e.g. mongodb://localhost:27017/hrms</summary>
        public string ConnectionString { get; set; } = "mongodb://localhost:27017/hrms";

        /// <summary>Database name. If omitted, falls back to the name in the connection string.</summary>
        public string DatabaseName { get; set; } = "hrms";
    }

    public class HangfireSettings
    {
        /// <summary>Connection string for the Hangfire job-storage database.</summary>
        public string MongoConnectionString { get; set; } = "mongodb://localhost:27017/hrms";

        /// <summary>Name of the Hangfire database (kept separate from the main DB).</summary>
        public string DatabaseName { get; set; } = "hrms_hangfire";
    }

    public class FileStorageSettings
    {
        /// <summary>"local" (default) or "azure-blob".</summary>
        public string Type { get; set; } = "local";

        /// <summary>Root folder for local file storage. Relative paths are resolved from ContentRootPath.</summary>
        public string LocalPath { get; set; } = "./uploads";

        public string AzureBlobConnection { get; set; } = string.Empty;
    }

    public class NotificationSettings
    {
        /// <summary>"mock" (console log) | "smtp" | "sendgrid".</summary>
        public string EmailProvider { get; set; } = "mock";
    }

    public class CorsSettings
    {
        /// <summary>Comma-separated list of allowed origins.</summary>
        public string Origin { get; set; } = "http://localhost:5173";
    }
}
