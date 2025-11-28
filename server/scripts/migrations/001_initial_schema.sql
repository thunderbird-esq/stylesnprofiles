-- NASA System 6 Portal - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates the initial database schema for the NASA System 6 Portal

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create saved_items table for storing NASA resources saved by users
CREATE TABLE IF NOT EXISTS saved_items (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('APOD', 'NEO', 'MARS', 'EPIC', 'EARTH', 'IMAGES')),
    title TEXT NOT NULL,
    url TEXT,
    hd_url TEXT,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    category TEXT,
    tags TEXT[],
    description TEXT,
    copyright TEXT,
    date DATE,
    service_version TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Create saved_searches table for tracking user search history
CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_string TEXT NOT NULL,
    search_type TEXT DEFAULT 'general' CHECK (search_type IN ('general', 'apod', 'neo', 'mars', 'epic')),
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    search_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT
);

-- Create collections table for organizing saved items
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_items junction table for many-to-many relationship between collections and saved items
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES saved_items(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    position INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(collection_id, item_id)
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    refresh_token_hash TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create api_keys table for external API key management
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_log table for tracking important actions
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Saved items table indexes
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_type ON saved_items(type);
CREATE INDEX IF NOT EXISTS idx_saved_items_category ON saved_items(category);
CREATE INDEX IF NOT EXISTS idx_saved_items_date ON saved_items(date);
CREATE INDEX IF NOT EXISTS idx_saved_items_saved_at ON saved_items(saved_at);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_items_tags ON saved_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_saved_items_metadata ON saved_items USING GIN(metadata);

-- Saved searches table indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_search_time ON saved_searches(search_time);
CREATE INDEX IF NOT EXISTS idx_saved_searches_query_string ON saved_searches(query_string);
CREATE INDEX IF NOT EXISTS idx_saved_searches_search_type ON saved_searches(search_type);
CREATE INDEX IF NOT EXISTS idx_saved_searches_session_id ON saved_searches(session_id);

-- Collections table indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_public ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

-- Collection items table indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_item_id ON collection_items(item_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_added_at ON collection_items(added_at);

-- User sessions table indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- API keys table indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Audit log table indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Create triggers for automatic timestamp updates

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_items_updated_at ON saved_items;
CREATE TRIGGER update_saved_items_updated_at BEFORE UPDATE ON saved_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- View for saved items with user information
DROP VIEW IF EXISTS saved_items_with_users;
CREATE OR REPLACE VIEW saved_items_with_users AS
SELECT
    si.*,
    u.username,
    u.display_name,
    u.avatar_url
FROM saved_items si
LEFT JOIN users u ON si.user_id = u.id;

-- View for public collections
DROP VIEW IF EXISTS public_collections;
CREATE OR REPLACE VIEW public_collections AS
SELECT
    c.*,
    u.username as owner_username,
    u.display_name as owner_display_name,
    COUNT(ci.id) as item_count
FROM collections c
JOIN users u ON c.user_id = u.id
LEFT JOIN collection_items ci ON c.id = ci.collection_id
WHERE c.is_public = true
GROUP BY c.id, u.username, u.display_name;

-- View for user statistics
DROP VIEW IF EXISTS user_statistics;
CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id,
    u.username,
    u.display_name,
    COUNT(DISTINCT si.id) as saved_items_count,
    COUNT(DISTINCT c.id) as collections_count,
    COUNT(DISTINCT ss.id) as searches_count,
    MAX(si.saved_at) as last_saved_item,
    MAX(ss.search_time) as last_search
FROM users u
LEFT JOIN saved_items si ON u.id = si.user_id
LEFT JOIN collections c ON u.id = c.user_id
LEFT JOIN saved_searches ss ON u.id = ss.user_id
GROUP BY u.id, u.username, u.display_name;

-- Create functions for common operations

-- Function to get trending items
CREATE OR REPLACE FUNCTION get_trending_items(days_back INTEGER DEFAULT 7, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id TEXT,
    type TEXT,
    title TEXT,
    url TEXT,
    category TEXT,
    save_count BIGINT,
    recent_saves BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.id,
        si.type,
        si.title,
        si.url,
        si.category,
        COUNT(*) as save_count,
        COUNT(*) FILTER (WHERE si.saved_at >= CURRENT_DATE - INTERVAL '1 day' * days_back) as recent_saves
    FROM saved_items si
    WHERE si.saved_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY si.id, si.type, si.title, si.url, si.category
    ORDER BY recent_saves DESC, save_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search saved items
CREATE OR REPLACE FUNCTION search_saved_items(
    search_query TEXT,
    item_types TEXT[] DEFAULT NULL,
    categories TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    type TEXT,
    title TEXT,
    url TEXT,
    category TEXT,
    description TEXT,
    saved_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.id,
        si.type,
        si.title,
        si.url,
        si.category,
        si.description,
        si.saved_at,
        CASE
            WHEN search_query IS NOT NULL THEN
                ts_rank_cd(
                    setweight(to_tsvector('english', COALESCE(si.title, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(si.description, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(si.category, '')), 'C'),
                    plainto_tsquery('english', search_query)
                )
            ELSE 1.0
        END as relevance_score
    FROM saved_items si
    WHERE
        (search_query IS NULL OR
         to_tsvector('english', COALESCE(si.title, '') || ' ' || COALESCE(si.description, '') || ' ' || COALESCE(si.category, '')) @@ plainto_tsquery('english', search_query))
        AND (item_types IS NULL OR si.type = ANY(item_types))
        AND (categories IS NULL OR si.category = ANY(categories))
    ORDER BY
        (CASE
            WHEN search_query IS NOT NULL THEN
                ts_rank_cd(
                    setweight(to_tsvector('english', COALESCE(si.title, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(si.description, '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(si.category, '')), 'C'),
                    plainto_tsquery('english', search_query)
                )
            ELSE 0
        END) DESC,
        si.saved_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create constraints and data validation

-- Add check constraints for data integrity
ALTER TABLE saved_items DROP CONSTRAINT IF EXISTS chk_saved_items_url;
ALTER TABLE saved_items ADD CONSTRAINT chk_saved_items_url
    CHECK (url IS NULL OR url ~ '^https?://.*');

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_email;
ALTER TABLE users ADD CONSTRAINT chk_users_email
    CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Set up row-level security (RLS) - can be enabled later when authentication is implemented
-- ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE saved_items IS 'NASA resources saved by users';
COMMENT ON TABLE saved_searches IS 'Search history and analytics';
COMMENT ON TABLE collections IS 'User-created collections for organizing saved items';
COMMENT ON TABLE collection_items IS 'Junction table linking collections to saved items';
COMMENT ON TABLE user_sessions IS 'User session management for authentication';
COMMENT ON TABLE api_keys IS 'External API keys for developers';
COMMENT ON TABLE audit_log IS 'Audit trail for important system actions';

-- Grant permissions (adjust as needed for your setup)
-- These will be commented out by default and should be configured based on your security requirements
-- GRANT CONNECT ON DATABASE nasa_system6_portal TO nasa_app_user;
-- GRANT USAGE ON SCHEMA public TO nasa_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nasa_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nasa_app_user;