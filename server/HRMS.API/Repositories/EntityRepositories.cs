using System.Threading.Tasks;
using MongoDB.Driver;
using HRMS.API.Models;
using HRMS.API.Services;

namespace HRMS.API.Repositories
{
    // USER REPOSITORY
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByAuth0IdAsync(string auth0Id);
    }

    public class UserRepository : MongoRepository<User>, IUserRepository
    {
        public UserRepository(MongoDbService dbService) : base(dbService, "users")
        {
        }

        public async Task<User?> GetByAuth0IdAsync(string auth0Id)
        {
            return await _collection.Find(u => u.Auth0Id == auth0Id).FirstOrDefaultAsync();
        }
    }

    // POSITION REPOSITORY
    public interface IPositionRepository : IRepository<Position>
    {
        Task<System.Collections.Generic.Dictionary<string, int>> GetStatusBreakdownAsync();
    }

    public class PositionRepository : MongoRepository<Position>, IPositionRepository
    {
        public PositionRepository(MongoDbService dbService) : base(dbService, "positions")
        {
        }

        public async Task<System.Collections.Generic.Dictionary<string, int>> GetStatusBreakdownAsync()
        {
            var aggregation = await _collection.Aggregate()
                .Group(
                    p => p.Status,
                    g => new { Status = g.Key, Count = g.Count() }
                )
                .ToListAsync();

            var result = new System.Collections.Generic.Dictionary<string, int>();
            foreach (var group in aggregation)
            {
                result[group.Status.ToString()] = group.Count;
            }
            return result;
        }
    }

    // CANDIDATE REPOSITORY
    public interface ICandidateRepository : IRepository<Candidate>
    {
    }

    public class CandidateRepository : MongoRepository<Candidate>, ICandidateRepository
    {
        public CandidateRepository(MongoDbService dbService) : base(dbService, "candidates")
        {
        }
    }

    // NOTIFICATION REPOSITORY
    public interface INotificationRepository : IRepository<Notification>
    {
    }

    public class NotificationRepository : MongoRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(MongoDbService dbService) : base(dbService, "notifications")
        {
        }
    }

    // MRF TEMPLATE REPOSITORY
    public interface IMrfTemplateRepository : IRepository<MrfTemplate>
    {
    }

    public class MrfTemplateRepository : MongoRepository<MrfTemplate>, IMrfTemplateRepository
    {
        public MrfTemplateRepository(MongoDbService dbService) : base(dbService, "mrfTemplates")
        {
        }
    }

    // COST CENTRE REPOSITORY
    public interface ICostCentreRepository : IRepository<CostCentre>
    {
    }

    public class CostCentreRepository : MongoRepository<CostCentre>, ICostCentreRepository
    {
        public CostCentreRepository(MongoDbService dbService) : base(dbService, "costCentres")
        {
        }
    }

    // DOA ENTRY REPOSITORY
    public interface IDoAEntryRepository : IRepository<DoAEntry>
    {
    }

    public class DoAEntryRepository : MongoRepository<DoAEntry>, IDoAEntryRepository
    {
        public DoAEntryRepository(MongoDbService dbService) : base(dbService, "doaList")
        {
        }
    }

    // RESIGNATION REPOSITORY
    public interface IResignationRepository : IRepository<Resignation>
    {
    }

    public class ResignationRepository : MongoRepository<Resignation>, IResignationRepository
    {
        public ResignationRepository(MongoDbService dbService) : base(dbService, "resignations")
        {
        }
    }
}
