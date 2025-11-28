-- Add local user for development mode
-- This user is used when authentication is disabled
INSERT INTO users (id, email, username, password_hash, role, display_name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'local@system.local',
    'local-user',
    'no-password-needed',
    'user',
    'Local User'
)
ON CONFLICT (id) DO NOTHING;
