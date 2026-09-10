CREATE TABLE IF NOT EXISTS used_password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    membership_number TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_used_password_reset_tokens_membership
    ON used_password_reset_tokens (membership_number);

CREATE INDEX IF NOT EXISTS idx_used_password_reset_tokens_expires
    ON used_password_reset_tokens (expires_at);
