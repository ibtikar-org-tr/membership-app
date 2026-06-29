CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    content_json TEXT NOT NULL DEFAULT '{}'
);
