-- Create password_reset_request table
CREATE TABLE IF NOT EXISTS password_reset_request (
    id TEXT PRIMARY KEY,
    membership_number TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    token TEXT NOT NULL
);

-- Create google_form_sheet table
CREATE TABLE IF NOT EXISTS google_form_sheet (
    id TEXT PRIMARY KEY,
    google_form_sheet_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    corresponding_values TEXT NOT NULL, -- JSON string for Dict<string, string>
    auto_note_column TEXT -- Column letter for tracking processed responses (e.g., 'Z')
);

-- Create google_sheet table
CREATE TABLE IF NOT EXISTS google_sheet (
    id TEXT PRIMARY KEY,
    google_sheet_id TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    corresponding_values TEXT NOT NULL -- JSON string for Dict<string, string>
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    user TEXT NOT NULL, -- membership_number or "admin"
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_password_reset_membership ON password_reset_request(membership_number);
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_request(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_request(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_request(status);
CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Canonical users table (D1 as source of truth for auth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    membership_number TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'admin')) DEFAULT 'member',
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'disabled')) DEFAULT 'active',
    latin_name TEXT,
    phone TEXT,
    whatsapp TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_membership_number ON users(membership_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Pending signups (awaiting admin approval)
CREATE TABLE IF NOT EXISTS pending_signups (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    requested_membership_number TEXT,
    data TEXT NOT NULL, -- JSON payload of submitted fields
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    approval_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_status ON pending_signups(status);

-- Server-side sessions (HttpOnly cookie-backed)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, -- session id stored in cookie
    user_id TEXT NOT NULL, -- FK to users.id (logical)
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- OAuth-style clients for other services (client_credentials)
CREATE TABLE IF NOT EXISTS oauth_clients (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    client_secret_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    allowed_ips TEXT, -- JSON array of CIDRs/IPs as string
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Optional tracking of issued tokens for auditing/revocation
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_client_id ON oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Google Sheet sync state (for future incremental sync if needed)
CREATE TABLE IF NOT EXISTS sheet_sync_state (
    id TEXT PRIMARY KEY,
    last_sync_at TEXT,
    last_checkpoint TEXT
);

