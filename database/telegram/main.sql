-- Telegram User States table
CREATE TABLE IF NOT EXISTS telegram_user_states (
    telegram_id TEXT PRIMARY KEY,
    state TEXT NOT NULL DEFAULT 'normal',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    modified_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Group Members table
CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    status TEXT NOT NULL DEFAULT 'member', -- member, left, kicked, banned, restricted, creator, administrator
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    left_at TEXT,
    last_seen TEXT,
    invited_by TEXT, -- User ID of who invited them
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(chat_id, user_id)
);
