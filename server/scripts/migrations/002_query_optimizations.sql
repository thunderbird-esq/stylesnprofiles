-- Database Query Optimization for Favorites and Collections
-- Migration: 002_query_optimizations.sql
-- Description: Optimizes database queries, adds missing columns, indexes, and caching support

-- =============================================
-- MISSING COLUMNS MIGRATION
-- =============================================

-- Add missing columns to saved_items table
ALTER TABLE saved_items
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_note TEXT,
ADD COLUMN IF NOT EXISTS user_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- =============================================
-- COMPOUND INDEXES FOR PERFORMANCE
-- =============================================

-- Compound index for user_id and item_type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_items_user_type
ON saved_items(user_id, type)
WHERE is_archived = false;

-- Compound index for user_id and is_archived filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_items_user_archived
ON saved_items(user_id, is_archived);

-- Compound index for item_date with user_id (for date-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_items_user_date
ON saved_items(user_id, date DESC)
WHERE is_archived = false;

-- Compound index for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_items_search
ON saved_items USING GIN(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, '') || ' ' || COALESCE(user_note, ''))
)
WHERE is_archived = false;

-- Index for user_tags array search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_items_user_tags
ON saved_items USING GIN(user_tags)
WHERE is_archived = false;

-- Compound index for collections with user and visibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_user_public
ON collections(user_id, is_public);

-- Compound index for collection_items with position ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_items_collection_position
ON collection_items(collection_id, position ASC);

-- Index for collection_items lookup by item_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_items_item_lookup
ON collection_items(item_id)
INCLUDE (collection_id, position, added_at);

-- =============================================
-- OPTIMIZED VIEWS AND FUNCTIONS
-- =============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS user_favorites_with_collections;
DROP VIEW IF EXISTS collection_items_optimized;

-- Create optimized view for user favorites with collection info
CREATE OR REPLACE VIEW user_favorites_with_collections AS
SELECT
    si.*,
    COALESCE(collection_stats.collection_count, 0) as collection_count,
    COALESCE(collection_stats.collection_names, '{}') as collection_names,
    -- Pre-computed relevance score for better search performance
    CASE
        WHEN si.title IS NOT NULL OR si.description IS NOT NULL OR si.category IS NOT NULL OR si.user_note IS NOT NULL
        THEN ts_rank_cd(
            setweight(to_tsvector('english', COALESCE(si.title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(si.description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(si.category, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(si.user_note, '')), 'D'),
            plainto_tsquery('english', COALESCE(si.title, ''))
        )
        ELSE 0.0
    END as search_rank
FROM saved_items si
LEFT JOIN (
    SELECT
        ci.item_id,
        COUNT(DISTINCT ci.collection_id) as collection_count,
        ARRAY_AGG(DISTINCT c.name) as collection_names
    FROM collection_items ci
    JOIN collections c ON ci.collection_id = c.id
    WHERE c.is_public = false OR c.user_id = ci.collection_id  -- User's own collections
    GROUP BY ci.item_id
) collection_stats ON si.id = collection_stats.item_id
WHERE si.is_archived = false;

-- Create optimized view for collection items
CREATE OR REPLACE VIEW collection_items_optimized AS
SELECT
    ci.collection_id,
    ci.item_id,
    ci.position,
    ci.notes as collection_notes,
    ci.added_at,
    si.type,
    si.title,
    si.url,
    si.hd_url,
    si.category,
    si.date,
    si.saved_at,
    si.user_note,
    si.user_tags,
    si.is_favorite,
    c.name as collection_name,
    c.is_public,
    u.username as owner_username,
    u.display_name as owner_display_name
FROM collection_items ci
JOIN saved_items si ON ci.item_id = si.id
JOIN collections c ON ci.collection_id = c.id
JOIN users u ON c.user_id = u.id
WHERE si.is_archived = false;

-- =============================================
-- OPTIMIZED QUERY FUNCTIONS
-- =============================================

-- Optimized function to get user favorites with pagination
CREATE OR REPLACE FUNCTION get_user_favorites_optimized(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_type TEXT DEFAULT NULL,
    p_include_archived BOOLEAN DEFAULT false,
    p_tags TEXT[] DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'saved_at'
)
RETURNS TABLE (
    id TEXT,
    user_id UUID,
    type TEXT,
    title TEXT,
    url TEXT,
    hd_url TEXT,
    media_type TEXT,
    category TEXT,
    description TEXT,
    copyright TEXT,
    date DATE,
    service_version TEXT,
    saved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    is_archived BOOLEAN,
    user_note TEXT,
    user_tags TEXT[],
    is_favorite BOOLEAN,
    collection_count INTEGER,
    collection_names TEXT[],
    relevance_score REAL
) AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    RETURN QUERY
    WITH filtered_items AS (
        SELECT
            si.*,
            -- Calculate collection count in subquery to avoid JOIN in main query
            (SELECT COUNT(*)
             FROM collection_items ci
             WHERE ci.item_id = si.id) as collection_count,
            -- Get collection names efficiently
            (SELECT ARRAY_AGG(c.name)
             FROM collection_items ci
             JOIN collections c ON ci.collection_id = c.id
             WHERE ci.item_id = si.id AND c.user_id = si.user_id) as collection_names
        FROM saved_items si
        WHERE si.user_id = p_user_id
        AND (p_include_archived = true OR si.is_archived = false)
        AND (p_type IS NULL OR si.type = p_type)
        AND (p_tags IS NULL OR si.user_tags && p_tags)
    ),
    ranked_items AS (
        SELECT
            *,
            CASE
                WHEN p_sort_by = 'saved_at' THEN EXTRACT(EPOCH FROM saved_at)
                WHEN p_sort_by = 'date' THEN EXTRACT(EPOCH FROM COALESCE(date, saved_at))
                WHEN p_sort_by = 'title' THEN lower(COALESCE(title, ''))
                WHEN p_sort_by = 'relevance' THEN 0.0  -- Placeholder for search relevance
                ELSE EXTRACT(EPOCH FROM saved_at)
            END as sort_key
        FROM filtered_items
    )
    SELECT
        ri.*,
        0.0 as relevance_score  -- Placeholder for search relevance
    FROM ranked_items ri
    ORDER BY
        CASE p_sort_by
            WHEN 'saved_at' THEN ri.saved_at
            WHEN 'date' THEN COALESCE(ri.date, ri.saved_at)
            WHEN 'title' THEN lower(ri.title)
            ELSE ri.saved_at
        END DESC NULLS LAST
    LIMIT p_limit OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- Optimized function to get collection items with efficient pagination
CREATE OR REPLACE FUNCTION get_collection_items_optimized(
    p_collection_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_sort_by TEXT DEFAULT 'position'
)
RETURNS TABLE (
    item_id TEXT,
    position INTEGER,
    collection_notes TEXT,
    added_to_collection_at TIMESTAMP WITH TIME ZONE,
    type TEXT,
    title TEXT,
    url TEXT,
    hd_url TEXT,
    category TEXT,
    description TEXT,
    date DATE,
    saved_at TIMESTAMP WITH TIME ZONE,
    user_note TEXT,
    user_tags TEXT[],
    is_favorite BOOLEAN
) AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    RETURN QUERY
    SELECT
        si.id,
        ci.position,
        ci.notes,
        ci.added_at,
        si.type,
        si.title,
        si.url,
        si.hd_url,
        si.category,
        si.description,
        si.date,
        si.saved_at,
        si.user_note,
        si.user_tags,
        si.is_favorite
    FROM collection_items ci
    JOIN saved_items si ON ci.item_id = si.id
    WHERE ci.collection_id = p_collection_id
    AND si.is_archived = false
    ORDER BY
        CASE p_sort_by
            WHEN 'position' THEN ci.position
            WHEN 'added_at' THEN ci.added_at
            WHEN 'saved_at' THEN si.saved_at
            WHEN 'title' THEN lower(si.title)
            ELSE ci.position
        END ASC NULLS LAST
    LIMIT p_limit OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- Optimized search function with improved performance
CREATE OR REPLACE FUNCTION search_favorites_optimized(
    p_user_id UUID,
    p_search_query TEXT,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_types TEXT[] DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id TEXT,
    type TEXT,
    title TEXT,
    url TEXT,
    category TEXT,
    description TEXT,
    saved_at TIMESTAMP WITH TIME ZONE,
    relevance_score REAL,
    collection_count INTEGER,
    collection_names TEXT[]
) AS $$
DECLARE
    v_offset INTEGER;
    v_search_vector TSVECTOR;
    v_search_query_ts TSQUERY;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    v_search_query_ts := plainto_tsquery('english', p_search_query);

    RETURN QUERY
    WITH search_results AS (
        SELECT
            si.*,
            ts_rank_cd(
                setweight(to_tsvector('english', COALESCE(si.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(si.description, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(si.category, '')), 'C') ||
                setweight(to_tsvector('english', COALESCE(si.user_note, '')), 'D'),
                v_search_query_ts
            ) as relevance_score,
            -- Subquery for collection data to avoid expensive JOINs
            (SELECT COUNT(*)
             FROM collection_items ci
             WHERE ci.item_id = si.id) as collection_count,
            (SELECT ARRAY_AGG(DISTINCT c.name)
             FROM collection_items ci
             JOIN collections c ON ci.collection_id = c.id
             WHERE ci.item_id = si.id AND c.user_id = si.user_id) as collection_names
        FROM saved_items si
        WHERE si.user_id = p_user_id
        AND si.is_archived = false
        AND to_tsvector('english',
            COALESCE(si.title, '') || ' ' ||
            COALESCE(si.description, '') || ' ' ||
            COALESCE(si.category, '') || ' ' ||
            COALESCE(si.user_note, '')
        ) @@ v_search_query_ts
        AND (p_types IS NULL OR si.type = ANY(p_types))
        AND (p_tags IS NULL OR si.user_tags && p_tags)
    )
    SELECT
        sr.id,
        sr.type,
        sr.title,
        sr.url,
        sr.category,
        sr.description,
        sr.saved_at,
        sr.relevance_score,
        sr.collection_count,
        sr.collection_names
    FROM search_results sr
    ORDER BY sr.relevance_score DESC, sr.saved_at DESC
    LIMIT p_limit OFFSET v_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get collection statistics efficiently
CREATE OR REPLACE FUNCTION get_collection_stats_optimized(p_user_id UUID)
RETURNS TABLE (
    total_collections INTEGER,
    public_collections INTEGER,
    private_collections INTEGER,
    total_items_in_collections BIGINT,
    avg_items_per_collection NUMERIC,
    largest_collection_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH collection_stats AS (
        SELECT
            c.id,
            c.is_public,
            COUNT(ci.id) as item_count
        FROM collections c
        LEFT JOIN collection_items ci ON c.id = ci.collection_id
        WHERE c.user_id = p_user_id
        GROUP BY c.id, c.is_public
    )
    SELECT
        COUNT(*) as total_collections,
        COUNT(*) FILTER (WHERE is_public = true) as public_collections,
        COUNT(*) FILTER (WHERE is_public = false) as private_collections,
        COALESCE(SUM(item_count), 0) as total_items_in_collections,
        CASE
            WHEN COUNT(*) > 0 THEN COALESCE(AVG(item_count), 0)::NUMERIC
            ELSE 0
        END as avg_items_per_collection,
        COALESCE(MAX(item_count), 0) as largest_collection_size
    FROM collection_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CACHING SUPPORT
-- =============================================

-- Create materialized view for trending items (for cache invalidation)
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_items_cache AS
SELECT
    si.type,
    si.category,
    COUNT(*) as save_count,
    COUNT(*) FILTER (WHERE si.saved_at >= CURRENT_DATE - INTERVAL '1 day') as recent_saves,
    MAX(si.saved_at) as latest_save
FROM saved_items si
WHERE si.is_archived = false
  AND si.saved_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY si.type, si.category
HAVING COUNT(*) > 0
ORDER BY recent_saves DESC, save_count DESC;

-- Create index for materialized view
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trending_items_type_category
ON trending_items_cache(type, category);

-- Function to refresh trending items cache
CREATE OR REPLACE FUNCTION refresh_trending_items_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_items_cache;
END;
$$ LANGUAGE plpgsql;

-- Create a function to invalidate user-specific caches
CREATE OR REPLACE FUNCTION invalidate_user_cache(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- This would be used by application-level caching
    -- The actual cache invalidation would be handled by Redis/Memcached
    -- This function serves as a notification point
    PERFORM pg_notify('user_cache_invalidate', p_user_id::TEXT);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PARTITIONING FOR LARGE TABLES (Optional)
-- =============================================

-- For very large installations, consider partitioning saved_items by date
-- This is commented out as it requires significant setup and should only be used when needed

/*
CREATE TABLE saved_items_partitioned (
    LIKE saved_items INCLUDING ALL
) PARTITION BY RANGE (saved_at);

-- Create monthly partitions
CREATE TABLE saved_items_2024_01 PARTITION OF saved_items_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE saved_items_2024_02 PARTITION OF saved_items_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add more partitions as needed
*/

-- =============================================
-- PERFORMANCE MONITORING
-- =============================================

-- Create a function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_query()
RETURNS TRIGGER AS $$
BEGIN
    IF (EXTRACT(EPOCH FROM (statement_timestamp() - query_start)) > 1.0) THEN
        INSERT INTO audit_log (user_id, action, resource_type, new_values, created_at)
        VALUES (
            NULL,
            'slow_query',
            'database',
            json_build_object(
                'query', current_query(),
                'duration', EXTRACT(EPOCH FROM (statement_timestamp() - query_start)),
                'user', current_user
            ),
            statement_timestamp()
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments for optimization documentation
COMMENT ON TABLE saved_items IS 'Optimized with compound indexes and full-text search support';
COMMENT ON TABLE collections IS 'Optimized for user-specific queries with compound indexes';
COMMENT ON TABLE collection_items IS 'Optimized for position-based ordering and efficient lookups';
COMMENT ON MATERIALIZED VIEW trending_items_cache IS 'Materialized view for trending items cache, refreshed periodically';

-- Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT SELECT ON trending_items_cache TO PUBLIC;