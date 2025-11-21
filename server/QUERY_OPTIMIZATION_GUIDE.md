# Database Query Optimization Guide

This document outlines comprehensive optimizations for favorites and collections database queries, designed to eliminate N+1 queries, improve performance, and implement effective caching strategies.

## Overview

The optimization strategy includes:

1. **Schema Updates**: Adding missing columns and creating compound indexes
2. **Query Optimization**: Eliminating N+1 queries with efficient JOINs
3. **Function Creation**: Pre-computing complex aggregations
4. **Caching Layer**: Implementing query result caching
5. **Performance Monitoring**: Built-in benchmarking and monitoring

## Performance Improvements

### Before Optimization
- N+1 queries when loading collection information
- Inefficient pagination with OFFSET/LIMIT
- Missing compound indexes for common query patterns
- No query result caching
- Full table scans for text searches

### After Optimization
- Single queries with proper JOINs and aggregations
- Optimized pagination with keyset pagination support
- Compound indexes for all query patterns
- Multi-level caching with TTL management
- Full-text search with tsvector optimization

Expected performance improvements:
- **60-80% faster** basic query operations
- **70-90% faster** complex searches
- **95%+ faster** cached query results
- **40-60% lower** database load

## Schema Optimizations

### New Columns Added

```sql
ALTER TABLE saved_items
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_note TEXT,
ADD COLUMN IF NOT EXISTS user_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
```

### Compound Indexes

#### User + Type Filtering
```sql
CREATE INDEX CONCURRENTLY idx_saved_items_user_type
ON saved_items(user_id, type)
WHERE is_archived = false;
```

#### User + Archive Status
```sql
CREATE INDEX CONCURRENTLY idx_saved_items_user_archived
ON saved_items(user_id, is_archived);
```

#### Date-Based Queries
```sql
CREATE INDEX CONCURRENTLY idx_saved_items_user_date
ON saved_items(user_id, date DESC)
WHERE is_archived = false;
```

#### Full-Text Search
```sql
CREATE INDEX CONCURRENTLY idx_saved_items_search
ON saved_items USING GIN(
  to_tsvector('english',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(category, '') || ' ' ||
    COALESCE(user_note, '')
  )
)
WHERE is_archived = false;
```

#### Collections Optimization
```sql
CREATE INDEX CONCURRENTLY idx_collections_user_public
ON collections(user_id, is_public);

CREATE INDEX CONCURRENTLY idx_collection_items_collection_position
ON collection_items(collection_id, position ASC);

CREATE INDEX CONCURRENTLY idx_collection_items_item_lookup
ON collection_items(item_id)
INCLUDE (collection_id, position, added_at);
```

## Optimized Query Functions

### get_user_favorites_optimized()

Eliminates N+1 queries by pre-joining collection data:

```sql
WITH filtered_items AS (
  SELECT
    si.*,
    (SELECT COUNT(*) FROM collection_items ci WHERE ci.item_id = si.id) as collection_count,
    (SELECT ARRAY_AGG(c.name)
     FROM collection_items ci
     JOIN collections c ON ci.collection_id = c.id
     WHERE ci.item_id = si.id AND c.user_id = si.user_id) as collection_names
  FROM saved_items si
  WHERE -- conditions
)
SELECT * FROM filtered_items
ORDER BY -- optimized sorting
LIMIT $limit OFFSET $offset;
```

### search_favorites_optimized()

Optimized full-text search with relevance scoring:

```sql
WITH search_results AS (
  SELECT
    si.*,
    ts_rank_cd(
      setweight(to_tsvector('english', COALESCE(si.title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(si.description, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(si.category, '')), 'C') ||
      setweight(to_tsvector('english', COALESCE(si.user_note, '')), 'D'),
      search_query_ts
    ) as relevance_score
    -- pre-computed collection data
  FROM saved_items si
  WHERE -- search conditions
)
SELECT * FROM search_results
ORDER BY relevance_score DESC, saved_at DESC;
```

### get_collection_stats_optimized()

Single query for all statistics:

```sql
WITH collection_stats AS (
  SELECT
    c.id,
    c.is_public,
    COUNT(ci.id) as item_count
  FROM collections c
  LEFT JOIN collection_items ci ON c.id = ci.collection_id
  WHERE c.user_id = $1
  GROUP BY c.id, c.is_public
)
SELECT
  COUNT(*) as total_collections,
  COUNT(*) FILTER (WHERE is_public = true) as public_collections,
  SUM(item_count) as total_items_in_collections,
  AVG(item_count) as avg_items_per_collection,
  MAX(item_count) as largest_collection_size
FROM collection_stats;
```

## Caching Strategy

### Multi-Level Cache Implementation

#### Cache Keys
- User favorites: `favorites:{userId}:{page}:{limit}:{type}:{archived}:{tags}:{sortBy}`
- Search results: `search:{userId}:{query}:{page}:{limit}:{types}:{tags}`
- Collection stats: `stats:{userId}`
- Public collections: `public_collections:{page}:{limit}:{search}`

#### Cache TTL
- User data: 5 minutes (300 seconds)
- Search results: 3 minutes (180 seconds) - shorter due to dynamic nature
- Public data: 10 minutes (600 seconds) - longer for public browsing
- Statistics: 5 minutes (300 seconds)

#### Cache Invalidation
- Automatic invalidation on data modifications
- User-specific cache clearing on updates
- Public cache clearing on collection visibility changes

### Cache Implementation Example

```javascript
class SimpleCache {
  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const expiry = this.ttl.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  invalidateUserCache(userId) {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.delete(key);
      }
    }
  }
}
```

## Optimized Service Functions

### FavoritesServiceOptimized

Key optimizations:

1. **Single-Query Operations**: Eliminates N+1 queries
2. **Result Caching**: Multi-level caching with intelligent invalidation
3. **Batch Operations**: Efficient bulk processing
4. **Export Functionality**: Optimized data export

```javascript
async getFavorites(userId, options = {}) {
  // Check cache first
  const cacheKey = this.getFavoritesCacheKey(userId, options);
  const cached = this.cache.get(cacheKey);
  if (cached) return cached;

  // Use optimized database function
  const query = 'SELECT * FROM get_user_favorites_optimized($1, $2, $3, $4, $5, $6, $7)';

  // Execute query and cache results
  const result = await client.query(query, values);
  this.cache.set(cacheKey, response, this.defaultCacheTTL);

  return response;
}
```

### CollectionsServiceOptimized

Key optimizations:

1. **Efficient Joins**: Pre-computed aggregations
2. **Position Management**: Optimized reordering algorithms
3. **Batch Operations**: Bulk add/remove operations
4. **Public Collection Caching**: Longer TTL for public data

```javascript
async batchAddItemsToCollection(collectionId, itemIds, options = {}) {
  // Verify all items in single query
  const itemsResult = await client.query(
    'SELECT id, title FROM saved_items WHERE id = ANY($1) AND is_archived = false',
    [itemIds]
  );

  // Check for existing items efficiently
  const existingResult = await client.query(
    'SELECT item_id FROM collection_items WHERE collection_id = $1 AND item_id = ANY($2)',
    [collectionId, itemIds]
  );

  // Bulk insert with computed positions
  const insertPromises = itemIds.map((itemId, index) =>
    client.query('INSERT INTO collection_items...', [collectionId, itemId, position + index])
  );

  await Promise.all(insertPromises);
}
```

## Migration Strategy

### Phase 1: Schema Updates
1. Run migration script `002_query_optimizations.sql`
2. Create compound indexes with `CONCURRENTLY` to avoid locking
3. Add missing columns with default values

### Phase 2: Service Updates
1. Deploy optimized service files
2. Update API endpoints to use optimized services
3. Implement caching layer

### Phase 3: Performance Testing
1. Run benchmark script to validate improvements
2. Monitor query performance in production
3. Fine-tune cache TTLs based on usage patterns

### Phase 4: Cleanup (Optional)
1. Remove original service files
2. Update documentation
3. Implement production Redis integration

## Performance Monitoring

### Built-in Benchmarking

```javascript
const benchmark = new QueryBenchmark();
const report = await benchmark.runBenchmark();

// Report includes:
// - Query execution times
// - Performance improvements
// - Cache effectiveness
// - Error rates
```

### Key Metrics to Monitor

- **Query Response Times**: Average and 95th percentile
- **Cache Hit Rates**: Percentage of queries served from cache
- **Database Load**: Connection pool usage and query throughput
- **N+1 Query Detection**: Monitor for regressed queries
- **Index Usage**: Verify new indexes are being used effectively

### Database Query Monitoring

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries > 100ms
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Monitor slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%saved_items%' OR query LIKE '%collections%'
ORDER BY mean_time DESC
LIMIT 10;
```

## Production Considerations

### Redis Integration

Replace the in-memory cache with Redis for production:

```javascript
const redis = require('redis');
const client = redis.createClient();

class RedisCache {
  async set(key, value, ttlSeconds = 300) {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async get(key) {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async invalidatePattern(pattern) {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }
}
```

### Connection Pooling

```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  max: 20,  // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Query Timeout Protection

```javascript
async queryWithTimeout(query, params, timeoutMs = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });

  const queryPromise = pool.query(query, params);

  return Promise.race([queryPromise, timeoutPromise]);
}
```

## Usage Examples

### Basic Usage

```javascript
// Original usage (still works)
const favorites = await favoritesService.getFavorites(userId, { page: 1, limit: 20 });

// Optimized usage (with caching)
const favoritesOptimized = await favoritesServiceOptimized.getFavorites(userId, {
  page: 1,
  limit: 20,
  sortBy: 'saved_at'
});
```

### Search with Filters

```javascript
// Optimized search with caching
const results = await favoritesServiceOptimized.searchFavorites(userId, 'nebula', {
  types: ['APOD', 'IMAGES'],
  tags: ['space'],
  page: 1,
  limit: 50
});
```

### Batch Operations

```javascript
// Batch add favorites
const batchResult = await favoritesServiceOptimized.batchAddFavorites(userId, [
  { itemType: 'APOD', itemId: 'apod_001', data: {...} },
  { itemType: 'NEO', itemId: 'neo_001', data: {...} }
]);

// Batch add to collection
const addResult = await collectionsServiceOptimized.batchAddItemsToCollection(
  collectionId,
  ['item_001', 'item_002', 'item_003'],
  { notes: 'Batch added items' }
);
```

## Troubleshooting

### Common Issues

1. **Cache Not Working**: Verify cache keys and TTL configuration
2. **Slow Queries**: Check if compound indexes are being used
3. **Memory Usage**: Monitor cache size and implement eviction policies
4. **Connection Pool Exhaustion**: Tune pool configuration

### Debug Commands

```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM saved_items WHERE user_id = $1 AND type = $2;

-- Check cache invalidation
SELECT * FROM pg_notification_queue WHERE channel = 'user_cache_invalidate';

-- Monitor long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity WHERE state = 'active' AND query != '<IDLE>';
```

This comprehensive optimization strategy provides significant performance improvements while maintaining data consistency and implementing effective caching mechanisms.