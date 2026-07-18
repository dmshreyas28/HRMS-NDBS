using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;
using System.Linq.Expressions;
using MongoDB.Driver;
using HRMS.API.Models;
using HRMS.API.Services;

namespace HRMS.API.Repositories
{
    public class CandidateStageCount
    {
        public string PositionId { get; set; } = null!;
        public string Stage { get; set; } = null!;
        public int Count { get; set; }
    }

    // USER REPOSITORY
    public interface IUserRepository
    {
        Task<List<User>> GetAllAsync();
        Task<User?> GetByIdAsync(string id);
        Task<List<User>> FindAsync(Expression<Func<User, bool>> filterExpression);
        Task CreateAsync(User entity);
        Task UpdateAsync(string id, User entity);
        Task DeleteAsync(string id);
        Task<long> CountAsync();
        Task<long> CountAsync(Expression<Func<User, bool>> filterExpression);
        Task<User?> GetByAuth0IdAsync(string auth0Id);
        Task<System.Collections.Generic.Dictionary<string, int>> GetUsersRoleBreakdownAsync();
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

        public async Task<System.Collections.Generic.Dictionary<string, int>> GetUsersRoleBreakdownAsync()
        {
            var aggregation = await _collection.Aggregate()
                .Group(
                    u => u.Role,
                    g => new { Role = g.Key, Count = g.Count() }
                )
                .ToListAsync();

            var result = new System.Collections.Generic.Dictionary<string, int>();
            foreach (var group in aggregation)
            {
                result[group.Role.ToString()] = group.Count;
            }
            return result;
        }
    }

    // POSITION REPOSITORY
    public interface IPositionRepository
    {
        Task<List<Position>> GetAllAsync();
        Task<Position?> GetByIdAsync(string id);
        Task<List<Position>> FindAsync(Expression<Func<Position, bool>> filterExpression);
        Task CreateAsync(Position entity);
        Task UpdateAsync(string id, Position entity);
        Task DeleteAsync(string id);
        Task<long> CountAsync();
        Task<long> CountAsync(Expression<Func<Position, bool>> filterExpression);
        Task<System.Collections.Generic.Dictionary<string, int>> GetStatusBreakdownAsync();
        Task<System.Collections.Generic.Dictionary<string, int>> GetHmStatusBreakdownAsync(string hmUserId);
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

        public async Task<System.Collections.Generic.Dictionary<string, int>> GetHmStatusBreakdownAsync(string hmUserId)
        {
            var aggregation = await _collection.Aggregate()
                .Match(p => p.RaisedBy == hmUserId)
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
    public interface ICandidateRepository
    {
        Task<List<Candidate>> GetAllAsync();
        Task<Candidate?> GetByIdAsync(string id);
        Task<List<Candidate>> FindAsync(Expression<Func<Candidate, bool>> filterExpression);
        Task CreateAsync(Candidate entity);
        Task UpdateAsync(string id, Candidate entity);
        Task DeleteAsync(string id);
        Task<long> CountAsync();
        Task<long> CountAsync(Expression<Func<Candidate, bool>> filterExpression);
        Task<System.Collections.Generic.List<CandidateStageCount>> GetStageCountsGroupedByPositionAsync();
    }

    public class CandidateRepository : MongoRepository<Candidate>, ICandidateRepository
    {
        public CandidateRepository(MongoDbService dbService) : base(dbService, "candidates")
        {
        }

        public async Task<System.Collections.Generic.List<CandidateStageCount>> GetStageCountsGroupedByPositionAsync()
        {
            var aggregation = await _collection.Aggregate()
                .Group(
                    c => new { c.PositionId, c.CurrentStage },
                    g => new { Key = g.Key, Count = g.Count() }
                )
                .ToListAsync();

            return aggregation.Select(a => new CandidateStageCount
            {
                PositionId = a.Key.PositionId,
                Stage = a.Key.CurrentStage.ToString(),
                Count = a.Count
            }).ToList();
        }
    }

    // NOTIFICATION REPOSITORY
    public class NotificationRepository : MongoRepository<Notification>
    {
        public NotificationRepository(MongoDbService dbService) : base(dbService, "notifications")
        {
        }
    }

    // MRF TEMPLATE REPOSITORY
    public class MrfTemplateRepository : MongoRepository<MrfTemplate>
    {
        public MrfTemplateRepository(MongoDbService dbService) : base(dbService, "mrfTemplates")
        {
        }
    }

    // COST CENTRE REPOSITORY
    public class CostCentreRepository : MongoRepository<CostCentre>
    {
        public CostCentreRepository(MongoDbService dbService) : base(dbService, "costCentres")
        {
        }
    }

    // DOA ENTRY REPOSITORY
    public class DoAEntryRepository : MongoRepository<DoAEntry>
    {
        public DoAEntryRepository(MongoDbService dbService) : base(dbService, "doaList")
        {
        }
    }

    // RESIGNATION REPOSITORY
    public class ResignationRepository : MongoRepository<Resignation>
    {
        public ResignationRepository(MongoDbService dbService) : base(dbService, "resignations")
        {
        }
    }
}
