# Favorites and Collections Architecture

## Overview

This document describes the enhanced architecture for the Favorites and Collections system in the NASA System 6 Portal. The system provides a robust, scalable solution for managing user favorites with advanced features like soft deletion, full-text search, tagging, and organization into collections.

## Architecture Principles

### 1. Data Consistency
- **ACID Transactions**: All multi-step operations use database transactions
- **Soft Delete**: Favorites are archived rather than hard deleted for data recovery
- **Referential Integrity**: Foreign key constraints ensure data relationships

### 2. Performance Optimization
- **No N+1 Queries**: All operations use proper JOINs to avoid performance issues
- **Pagination**: Implement with LIMIT/OFFSET for efficient data retrieval
- **Database Indexing**: Comprehensive indexing strategy for fast queries
- **Connection Pooling**: PostgreSQL connection pooling for scalability

### 3. Search Capabilities
- **Full-Text Search**: PostgreSQL tsvector/tsearch for relevance scoring
- **Faceted Search**: Support for filtering by type, tags, and categories
- **Search Rankings**: Relevance scoring based on content importance

### 4. Scalability
- **Horizontal Scaling**: Designed for read replicas and sharding
- **Caching Strategy**: Built-in caching hooks for Redis integration
- **API Rate Limiting**: Prepared for rate limiting implementation

## Database Schema

### Enhanced Tables

#### saved_items
```sql
- id (TEXT, PRIMARY KEY) - External item identifier
- user_id (UUID, FOREIGN KEY) - User who owns the favorite
- type (TEXT, CHECK constraint) - APOD, NEO, MARS, EPIC, EARTH, IMAGES
- is_archived (BOOLEAN, DEFAULT false) - Soft delete flag
- user_note (TEXT) - Personal notes by user
- user_tags (TEXT[]) - User-defined tags
- is_favorite (BOOLEAN, DEFAULT false) - Special favorite marking
- metadata (JSONB) - Flexible metadata storage
```

**Key Features:**
- Soft deletion with `is_archived` flag
- User customization with notes and tags
- Metadata storage for extensible data
- Comprehensive indexing for performance

#### collections
```sql
- id (UUID, PRIMARY KEY) - Internal collection identifier
- user_id (UUID, FOREIGN KEY) - Collection owner
- name (TEXT, UNIQUE per user) - Collection name
- description (TEXT) - Optional description
- is_public (BOOLEAN, DEFAULT false) - Public visibility
- cover_image_url (TEXT) - Collection cover image
```

**Key Features:**
- User-scoped unique names
- Public/private visibility options
- Cover image support
- Automatic timestamp updates

#### collection_items
```sql
- id (UUID, PRIMARY KEY) - Junction table identifier
- collection_id (UUID, FOREIGN KEY) - Collection reference
- item_id (TEXT, FOREIGN KEY) - Saved item reference
- position (INTEGER, DEFAULT 0) - Ordering within collection
- notes (TEXT) - Collection-specific notes
- added_at (TIMESTAMP) - When item was added
```

**Key Features:**
- Flexible positioning system
- Per-collection notes
- Automatic reordering on deletion
- Timestamp tracking

### Database Functions

#### search_favorites()
```sql
search_favorites(
    search_user_id UUID,
    search_query TEXT,
    item_types TEXT[] DEFAULT NULL,
    user_tags TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    include_archived BOOLEAN DEFAULT false
)
```
**Purpose**: Full-text search with relevance scoring and filtering.

#### get_collection_statistics()
```sql
get_collection_statistics(collection_user_id UUID)
```
**Purpose**: Returns aggregated statistics for user's collections.

#### search_public_collections()
```sql
search_public_collections(
    search_query TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
```
**Purpose**: Search public collections with relevance scoring.

### Database Views

#### enhanced_favorites
Combines saved items with collection information and counts without N+1 queries.

#### enhanced_collections
Combines collections with item counts and contributor information.

## Service Architecture

### FavoritesService

**Core Methods:**
- `getFavorites(userId, options)` - Paginated retrieval with filtering
- `getFavoriteById(userId, favoriteId)` - Single item retrieval
- `addFavorite(userId, itemData)` - Create new favorite with validation
- `updateFavorite(userId, favoriteId, updateData)` - Update notes, tags, or status
- `removeFavorite(userId, favoriteId)` - Soft delete/archiving
- `searchFavorites(userId, query, options)` - Full-text search
- `getFavoriteStats(userId)` - User statistics

**Key Features:**
- Input validation and sanitization
- Comprehensive error handling
- Transaction support for complex operations
- Collection information inclusion without N+1 queries

### CollectionsService

**Core Methods:**
- `getCollections(userId, options)` - Paginated with public inclusion
- `getCollectionById(userId, collectionId)` - Single collection with public access
- `createCollection(userId, data)` - Create with name validation
- `updateCollection(userId, collectionId, data)` - Update with conflict checking
- `deleteCollection(userId, collectionId)` - Delete with cascade
- `addItemToCollection(collectionId, favoriteId, options)` - Add with positioning
- `removeItemFromCollection(collectionId, favoriteId)` - Remove with reordering
- `getCollectionItems(collectionId, options)` - Paginated item retrieval
- `reorderCollectionItems(userId, collectionId, itemOrders)` - Bulk reordering
- `getCollectionStats(userId)` - User collection statistics
- `getPublicCollections(options)` - Browse public collections

**Key Features:**
- Position management with automatic gap filling
- Public/private access control
- Transaction-based reordering
- Comprehensive pagination

## Performance Optimizations

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_saved_items_user_type ON saved_items(user_id, type);
CREATE INDEX idx_saved_items_fulltext ON saved_items USING GIN(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);
CREATE INDEX idx_collection_items_position ON collection_items(collection_id, position);
CREATE INDEX idx_collections_public_updated ON collections(is_public, updated_at DESC);
```

### Query Optimization
- **Avoiding N+1**: All complex queries use JOINs with proper grouping
- **Pagination**: Efficient LIMIT/OFFSET with total count queries
- **Full-Text Search**: PostgreSQL's built-in search capabilities
- **Batch Operations**: Bulk updates for reordering operations

### Caching Strategy
- **Result Caching**: Query results cached with invalidation on updates
- **Connection Pooling**: PostgreSQL connection pool configuration
- **Prepared Statements**: Query plan caching for repeated operations

## API Design Patterns

### RESTful Conventions
- **GET /api/favorites** - List with pagination and filtering
- **POST /api/favorites** - Create with validation
- **GET /api/favorites/{id}** - Retrieve single item
- **PATCH /api/favorites/{id}** - Partial updates
- **DELETE /api/favorites/{id}** - Soft delete

### Error Handling
```javascript
// Consistent error response format
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **Type Checking**: Comprehensive type validation
- **Length Limits**: Field length enforcement
- **Business Rules**: Application-specific validation

## Security Considerations

### Data Access Control
- **User Isolation**: Queries always filter by user_id
- **Public Collections**: Separate access controls for public content
- **Row Level Security**: Prepared for RLS implementation
- **SQL Injection Protection**: Parameterized queries throughout

### Privacy Features
- **Soft Delete**: Data retention for privacy compliance
- **User Control**: Users control public visibility
- **Data Minimization**: Only necessary data stored and exposed

## Scalability Planning

### Database Scaling
- **Read Replicas**: Prepared for read replica implementation
- **Sharding**: User-based sharding strategy
- **Connection Pooling**: Configured for high concurrency

### Application Scaling
- **Stateless Services**: Services designed for horizontal scaling
- **Load Balancing**: Prepared for load balancer distribution
- **Caching Layer**: Redis integration hooks

## Monitoring and Observability

### Performance Metrics
- **Query Performance**: Slow query logging and analysis
- **Connection Usage**: Pool utilization monitoring
- **Cache Hit Rates**: Effectiveness measurement

### Business Metrics
- **User Engagement**: Favorite and collection creation rates
- **Search Usage**: Search query patterns and effectiveness
- **Public Content**: Public collection adoption

## Testing Strategy

### Unit Tests
- **Service Methods**: Individual method testing with mocked dependencies
- **Input Validation**: Comprehensive validation testing
- **Error Cases**: All error path testing

### Integration Tests
- **Database Operations**: Real database integration
- **Transaction Handling**: Rollback and commit testing
- **Performance Testing**: Load and concurrency testing

### End-to-End Tests
- **API Workflows**: Complete user journey testing
- **Search Functionality**: Full-text search validation
- **Collection Management**: Complete collection lifecycle testing

## Future Enhancements

### Planned Features
- **Social Features**: Following other users' collections
- **Advanced Search**: AI-powered search recommendations
- **Analytics**: User behavior analytics and insights
- **Export/Import**: Collection backup and sharing features

### Technical Improvements
- **Event-Driven Architecture**: Real-time updates via websockets
- **Elasticsearch Integration**: Advanced search capabilities
- **GraphQL API**: Flexible query interface
- **Mobile API**: Optimized mobile endpoints

## Conclusion

The enhanced Favorites and Collections system provides a robust foundation for managing user content with excellent performance, scalability, and user experience. The architecture follows best practices for Node.js/Express applications with PostgreSQL, ensuring reliability and maintainability as the system grows.

The modular service design, comprehensive database schema, and extensive testing coverage provide confidence in the system's ability to handle production workloads while maintaining data integrity and performance standards.