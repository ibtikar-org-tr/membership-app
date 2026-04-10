CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')) ON UPDATE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE,
    owner TEXT NOT NULL, -- membership_number of the user who owns the project (only one owner per project, but managers can be multiple)
    status TEXT NOT NULL, -- "active", "completed", "archived"
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    membership_number TEXT NOT NULL,
    role TEXT NOT NULL, -- "member", "manager", "observer"
    PRIMARY KEY (project_id, membership_number)
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')) ON UPDATE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL, -- membership_number of the user who created the task
    status TEXT NOT NULL, -- "open", "in_progress", "completed", "archived"
    due_date TEXT, -- stored as ISO 8601 string (e.g., "1990-01-01")
    points INTEGER NOT NULL DEFAULT 0,
    assigned_to TEXT, -- membership_number of the user assigned to the task
    completed_by TEXT, -- membership_number of the user who marked the task as completed
    completed_at TEXT, -- stored as ISO 8601 string (e.g., "1990-01-01T12:00:00Z")
    -- completion_approval_status TEXT NOT NULL DEFAULT 'pending' -- "pending", "approved", "rejected"
    completion_approval_by TEXT -- membership_number of the user who approved the task completion (set when approved, rejection will reset the completed_by and completed_at fields to NULL)
)
