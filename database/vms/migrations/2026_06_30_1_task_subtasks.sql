CREATE TABLE IF NOT EXISTS task_subtasks (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    parent_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    completed_at TEXT,
    completed_by TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TRIGGER IF NOT EXISTS update_task_subtask_updated_at AFTER UPDATE ON task_subtasks
BEGIN
    UPDATE task_subtasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent ON task_subtasks(parent_task_id);
