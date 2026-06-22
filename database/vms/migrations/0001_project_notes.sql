CREATE TABLE IF NOT EXISTS project_notes (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    content_preview TEXT,
    created_by TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS update_project_note_updated_at AFTER UPDATE ON project_notes
BEGIN
    UPDATE project_notes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes(project_id);
