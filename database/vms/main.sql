CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    description TEXT,
    parent_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    owner TEXT NOT NULL, -- membership_number of the user who owns the project (only one owner per project, but managers can be multiple)
    status TEXT NOT NULL -- "active", "completed", "archived"
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    membership_number TEXT NOT NULL,
    role TEXT NOT NULL, -- "member", "manager", "observer"
    PRIMARY KEY (project_id, membership_number)
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
);

CREATE TABLE IF NOT EXISTS points_transactions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    membership_number TEXT NOT NULL, -- membership_number of the user whose points are being changed
    task_id TEXT, -- task_id associated with the points change (can be NULL for non-task-related transactions)
    amount INTEGER NOT NULL,
    type TEXT NOT NULL -- "task_reward", "purchase", "event_attendance", "other"
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL, -- stored as ISO 8601 string (e.g., "1990-01-01T12:00:00Z")
    end_time TEXT NOT NULL, -- stored as ISO 8601 string (e.g., "1990-01-01T12:00:00Z")
    location TEXT,
    created_by TEXT NOT NULL, -- membership_number of the user who created the event
    project_id TEXT REFERENCES projects(id), -- optional association with a project
    required_skills TEXT, -- comma-separated list of skills required for the event (e.g., "python,project_management,design")
    recommended_skills TEXT, -- comma-separated list of skills recommended for the event (e.g., "python,project_management,design")
    aquired_skills TEXT -- comma-separated list of skills that participants can acquire or improve by attending the event (e.g., "python,project_management,design")
);

CREATE TABLE IF NOT EXISTS event_tickets ( -- the available tickets for the events, 
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    point_price INTEGER NOT NULL, -- price in points (can be 0 for free tickets, negative for rewarding points to participants, and positive for charging points from participants)
    currency_price TEXT NOT NULL, -- price in currency (e.g., 10 $USD, 250 TRY, 10000 SYP, etc.)
    quantity INTEGER NOT NULL -- total quantity of this ticket type available for the event
);

CREATE TABLE IF NOT EXISTS event_registrations ( -- the registrations of users to the events, each registration is for one ticket
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    membership_number TEXT NOT NULL, -- membership_number of the user who registered for the event
    ticket_id TEXT NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- "registered", "attended", "cancelled", "no_show"
    approved_by TEXT -- membership_number of the user who approved the status (e.g., marking as attended, marking as no_show etc.)
);

