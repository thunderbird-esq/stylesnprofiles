-- Favorites and Collections Enhancements Migration
-- Migration: 002_favorites_collections_enhancements.sql
-- Description: Enhances saved_items and collections with additional features

-- Add new columns to saved_items table for enhanced favorites functionality
ALTER TABLE saved_items
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_note TEXT,
ADD COLUMN IF NOT EXISTS user_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create indexes for the new columns for performance
CREATE INDEX IF NOT EXISTS idx_saved_items_is_archived ON saved_items(is_archived);
CREATE INDEX IF NOT EXISTS idx_saved_items_is_favorite ON saved_items(is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_tags ON saved_items USING GIN(user_tags);

-- Add full-text search index for saved_items
CREATE INDEX IF NOT EXISTS idx_saved_items_fulltext ON saved_items USING GIN(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, '') || ' ' || COALESCE(user_note, ''))
);

-- Add position column to collection_items if not exists (for ordering)
ALTER TABLE collection_items
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create index for position ordering
CREATE INDEX IF NOT EXISTS idx_collection_items_position ON collection_items(collection_id, position);

-- Add notes column to collection_items for per-item notes
ALTER TABLE collection_items
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create function to search favorites with relevance scoring
CREATE OR REPLACE FUNCTION search_favorites(
    search_user_id UUID,
    search_query TEXT,
    item_types TEXT[] DEFAULT NULL,
    user_tags TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0,
    include_archived BOOLEAN DEFAULT false
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
    saved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    is_archived BOOLEAN,
    user_note TEXT,
    user_tags TEXT[],
    is_favorite BOOLEAN,
    relevance_score REAL,
    collection_count BIGINT,
    collection_names TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.*,
        ts_rank(
            to_tsvector('english', COALESCE(si.title, '') || ' ' || COALESCE(si.description, '') || ' ' || COALESCE(si.category, '') || ' ' || COALESCE(si.user_note, '')),
            plainto_tsquery('english', search_query)
        ) as relevance_score,
        COUNT(DISTINCT ci.id) as collection_count,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as collection_names
    FROM saved_items si
    LEFT JOIN collection_items ci ON si.id = ci.item_id
    LEFT JOIN collections c ON ci.collection_id = c.id AND c.user_id = si.user_id
    WHERE
        si.user_id = search_user_id
        AND (include_archived = true OR si.is_archived = false)
        AND (
            search_query IS NULL OR
            to_tsvector('english', COALESCE(si.title, '') || ' ' || COALESCE(si.description, '') || ' ' || COALESCE(si.category, '') || ' ' || COALESCE(si.user_note, ''))
            @@ plainto_tsquery('english', search_query)
        )
        AND (item_types IS NULL OR si.type = ANY(item_types))
        AND (user_tags IS NULL OR si.user_tags && user_tags)
    GROUP BY si.id
    ORDER BY
        CASE
            WHEN search_query IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', COALESCE(si.title, '') || ' ' || COALESCE(si.description, '') || ' ' || COALESCE(si.category, '') || ' ' || COALESCE(si.user_note, '')),
                    plainto_tsquery('english', search_query)
                )
            ELSE 0
        END DESC,
        si.saved_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get collection statistics
CREATE OR REPLACE FUNCTION get_collection_statistics(collection_user_id UUID)
RETURNS TABLE (
    total_collections BIGINT,
    public_collections BIGINT,
    private_collections BIGINT,
    total_items_in_collections BIGINT,
    avg_items_per_collection NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_collections,
        COUNT(*) FILTER (WHERE is_public = true) as public_collections,
        COUNT(*) FILTER (WHERE is_public = false) as private_collections,
        COALESCE(SUM(item_count), 0) as total_items_in_collections,
        COALESCE(AVG(item_count), 0) as avg_items_per_collection
    FROM collections c
    LEFT JOIN (
        SELECT collection_id, COUNT(*) as item_count
        FROM collection_items
        GROUP BY collection_id
    ) ci ON c.id = ci.collection_id
    WHERE c.user_id = collection_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to search public collections
CREATE OR REPLACE FUNCTION search_public_collections(
    search_query TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    is_public BOOLEAN,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    item_count BIGINT,
    owner_username TEXT,
    owner_display_name TEXT,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.*,
        COUNT(ci.id) as item_count,
        u.username as owner_username,
        u.display_name as owner_display_name,
        CASE
            WHEN search_query IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, '')),
                    plainto_tsquery('english', search_query)
                )
            ELSE 1.0
        END as relevance_score
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.is_public = true
        AND (
            search_query IS NULL OR
            to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, ''))
            @@ plainto_tsquery('english', search_query)
        )
    GROUP BY c.id, u.username, u.display_name
    ORDER BY
        CASE
            WHEN search_query IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, '')),
                    plainto_tsquery('english', search_query)
                )
            ELSE 0
        END DESC,
        c.updated_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Add constraints for data integrity
ALTER TABLE saved_items
ADD CONSTRAINT chk_saved_items_user_tags
    CHECK (user_tags IS NULL OR array_length(user_tags, 1) IS NULL OR array_length(user_tags, 1) > 0);

ALTER TABLE collection_items
ADD CONSTRAINT chk_collection_items_position
    CHECK (position >= 0);

-- Create view for enhanced favorites with collection information
CREATE OR REPLACE VIEW enhanced_favorites AS
SELECT
    si.*,
    COUNT(DISTINCT ci.id) as collection_count,
    ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as collection_names
FROM saved_items si
LEFT JOIN collection_items ci ON si.id = ci.item_id
LEFT JOIN collections c ON ci.collection_id = c.id AND c.user_id = si.user_id
GROUP BY si.id;

-- Create view for collections with enhanced information
CREATE OR REPLACE VIEW enhanced_collections AS
SELECT
    c.*,
    COUNT(DISTINCT ci.id) as item_count,
    u.username as owner_username,
    u.display_name as owner_display_name,
    COUNT(DISTINCT si.user_id) as unique_contributors
FROM collections c
LEFT JOIN collection_items ci ON c.id = ci.collection_id
LEFT JOIN saved_items si ON ci.item_id = si.id
LEFT JOIN users u ON c.user_id = u.id
GROUP BY c.id, u.username, u.display_name;

-- Create trigger to automatically update timestamps on collection_items changes
CREATE OR REPLACE FUNCTION update_collection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE collections
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.collection_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_collection_timestamp_on_insert
    AFTER INSERT ON collection_items
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_timestamp();

CREATE TRIGGER update_collection_timestamp_on_delete
    AFTER DELETE ON collection_items
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_timestamp();

-- Add comments for documentation
COMMENT ON COLUMN saved_items.is_archived IS 'Soft delete flag for favorites (false = active, true = archived)';
COMMENT ON COLUMN saved_items.user_note IS 'Personal notes added by the user about this item';
COMMENT ON COLUMN saved_items.user_tags IS 'User-defined tags for organizing and categorizing favorites';
COMMENT ON COLUMN saved_items.is_favorite IS 'Special flag to mark particularly important favorites';
COMMENT ON COLUMN collection_items.position IS 'Ordering position within the collection (0-based)';
COMMENT ON COLUMN collection_items.notes IS 'Notes about this specific item within the collection context';

-- Grant permissions (adjust as needed for your setup)
-- These will be commented out by default and should be configured based on your security requirements
-- GRANT EXECUTE ON FUNCTION search_favorites TO nasa_app_user;
-- GRANT EXECUTE ON FUNCTION get_collection_statistics TO nasa_app_user;
-- GRANT EXECUTE ON FUNCTION search_public_collections TO nasa_app_user;
-- GRANT SELECT ON enhanced_favorites TO nasa_app_user;
-- GRANT SELECT ON enhanced_collections TO nasa_app_user;