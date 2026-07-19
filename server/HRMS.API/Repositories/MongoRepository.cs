using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using MongoDB.Driver;
using HRMS.API.Services;

namespace HRMS.API.Repositories
{
    public class MongoRepository<T> where T : class
    {
        protected readonly IMongoCollection<T> _collection;

        public MongoRepository(MongoDbService dbService, string collectionName)
        {
            _collection = dbService.GetCollection<T>(collectionName);
        }

        public virtual async Task<List<T>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public virtual async Task<T?> GetByIdAsync(string id)
        {
            var filter = Builders<T>.Filter.Eq("Id", id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public virtual async Task<List<T>> FindAsync(Expression<Func<T, bool>> filterExpression)
        {
            return await _collection.Find(filterExpression).ToListAsync();
        }

        public virtual async Task CreateAsync(T entity)
        {
            await _collection.InsertOneAsync(entity);
        }

        public virtual async Task UpdateAsync(string id, T entity)
        {
            var filter = Builders<T>.Filter.Eq("Id", id);
            await _collection.ReplaceOneAsync(filter, entity);
        }

        public virtual async Task DeleteAsync(string id)
        {
            var filter = Builders<T>.Filter.Eq("Id", id);
            await _collection.DeleteOneAsync(filter);
        }

        public virtual async Task<long> CountAsync()
        {
            return await _collection.CountDocumentsAsync(_ => true);
        }

    }
}
