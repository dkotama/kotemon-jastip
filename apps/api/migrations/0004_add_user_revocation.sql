-- Migration: Add user revocation fields
-- Revoking a token now also revokes user access (soft delete)

ALTER TABLE users ADD COLUMN is_revoked INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN revoked_at TEXT;
ALTER TABLE users ADD COLUMN revoked_by TEXT;

-- Create index for checking revoked users
CREATE INDEX idx_users_revoked ON users(is_revoked);
