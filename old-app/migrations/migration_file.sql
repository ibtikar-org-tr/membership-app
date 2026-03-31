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
