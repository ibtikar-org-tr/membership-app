-- All Private Messages table
CREATE TABLE IF NOT EXISTS all_messages_private (
    id TEXT PRIMARY KEY,
    message_json TEXT NOT NULL,
    message_text TEXT,
    chat_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- All Group Messages table
CREATE TABLE IF NOT EXISTS all_messages_groups (
    id TEXT PRIMARY KEY,
    message_json TEXT NOT NULL,
    message_text TEXT,
    chat_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message_thread_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);