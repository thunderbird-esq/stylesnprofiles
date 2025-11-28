-- Add missing columns for favorites and collections services
-- Migration: 003_add_missing_service_columns.sql
-- Description: Add columns needed by the favorites and collections services

-- Add user_note and user_tags to saved_items table
ALTER TABLE saved_items
ADD COLUMN IF NOT EXISTS user_note TEXT,
ADD COLUMN IF NOT EXISTS user_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_saved_items_user_tags ON saved_items USING GIN(user_tags);
CREATE INDEX IF NOT EXISTS idx_saved_items_is_favorite ON saved_items(is_favorite);
CREATE INDEX IF NOT EXISTS idx_saved_items_is_archived ON saved_items(is_archived);

-- Add comments for documentation
COMMENT ON COLUMN saved_items.user_note IS 'User personal notes about this saved item';
COMMENT ON COLUMN saved_items.user_tags IS 'User-defined tags for organizing saved items';
COMMENT ON COLUMN saved_items.is_favorite IS 'Whether user has marked this item as a favorite';