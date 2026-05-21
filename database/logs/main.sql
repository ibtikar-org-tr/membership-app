CREATE TABLE IF NOT EXISTS cron_notification_log (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL DEFAULT 'event_reminder',
    entity_type TEXT NOT NULL DEFAULT 'event',
    entity_id TEXT NOT NULL,
    recipient TEXT NOT NULL,
    reminder_kind TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_log_dedupe
    ON cron_notification_log (job_type, entity_type, entity_id, recipient, reminder_kind);

CREATE INDEX IF NOT EXISTS idx_cron_log_sent_at ON cron_notification_log (sent_at);
