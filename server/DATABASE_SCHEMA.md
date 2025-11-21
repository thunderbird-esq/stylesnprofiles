# Database Schema

This document describes the real database schema used by the server application. No mock data is used - all operations use real PostgreSQL database connections.

## Tables

### saved_items

Stores NASA resources that users have saved for later access.

```sql
CREATE TABLE saved_items (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('APOD', 'NEO', 'MARS', 'IMAGES')),
    title VARCHAR(200) NOT NULL,
    url TEXT,
    category VARCHAR(50),
    description TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_saved_items_type ON saved_items(type);
CREATE INDEX idx_saved_items_category ON saved_items(category);
CREATE INDEX idx_saved_items_saved_at ON saved_items(saved_at DESC);
```

### saved_searches

Tracks user search queries for analytics and search history.

```sql
CREATE TABLE saved_searches (
    id SERIAL PRIMARY KEY,
    query_string VARCHAR(200) NOT NULL,
    search_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_saved_searches_query_string ON saved_searches(query_string);
CREATE INDEX idx_saved_searches_search_time ON saved_searches(search_time DESC);
```

## Database Connection

The application uses PostgreSQL with connection pooling:

- **Connection Pool**: Configured with environment variables
- **Timeout**: Queries have built-in timeout protection
- **Transactions**: Support for atomic operations
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Environment Variables

Required database environment variables:

```bash
DB_USER=your_database_user
DB_HOST=localhost
DB_DATABASE=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=5432
```

## Data Validation

All data is validated at the application level before database operations:

- **Type Validation**: Enum values checked against allowed types
- **Length Validation**: String fields have maximum length constraints
- **URL Validation**: URL fields validated for proper format
- **Required Fields**: Essential fields are validated as required

## Testing

Integration tests use the real database schema:

- Tests use real database connections
- Test data is cleaned up after each test run
- Database transactions are tested with rollback scenarios
- Error handling is tested with realistic failure scenarios

No mock data or mock database connections are used in production or testing.