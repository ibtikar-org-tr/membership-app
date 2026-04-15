CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    description TEXT,
    parent_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL, -- allows for nesting projects, technically the whole application can be one big project with multiple levels of sub-projects
    owner TEXT NOT NULL, -- membership_number of the user who owns the project (only one owner per project, but managers can be multiple)
    telegram_group_id TEXT UNIQUE, -- unique Telegram group ID associated with the project for communication and updates (e.g., "-123456789"), this will be stored and used by the bot
    status TEXT NOT NULL -- "active", "completed", "archived"
);

-- This will be handled in the backend to avoid sql looping
-- CREATE TRIGGER IF NOT EXISTS update_project_updated_at AFTER UPDATE ON projects
-- BEGIN
--     UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
-- END;

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
    -- completion_approval_status TEXT NOT NULL DEFAULT 'pending' -- "pending", "approved", "rejected" (removed for simplicity, now the task completion depends on the approved_by field)
    approved_by TEXT, -- membership_number of the user who approved the task completion (set when approved, rejection will reset the completed_by and completed_at fields to NULL)
    skills TEXT -- JSON array of skill names required/recommended/aquired for the event (e.g., {"python": "required", "project_management": "recommended", "design": "aquired"} )
);

CREATE TRIGGER IF NOT EXISTS update_task_updated_at AFTER UPDATE ON tasks
BEGIN
    UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS points_transactions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    membership_number TEXT NOT NULL, -- membership_number of the user whose points are being changed
    task_id TEXT, -- task_id associated with the points change (can be NULL for non-task-related transactions)
    amount INTEGER NOT NULL,
    type TEXT NOT NULL -- "task_reward", "purchase", "event_attendance", "other"
);

CREATE TRIGGER IF NOT EXISTS update_points_transaction_updated_at AFTER UPDATE ON points_transactions
BEGIN
    UPDATE points_transactions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    description TEXT,
    start_time TEXT, -- stored as ISO 8601 string (e.g., "1990-01-01T12:00:00Z")
    end_time TEXT, -- stored as ISO 8601 string (e.g., "1990-01-01T12:00:00Z")
    location TEXT,
    image_url TEXT, -- banner image URL associated with the event (e.g., "https://example.com/banner.jpg")
    associated_urls TEXT, -- JSON array of URLs associated with the event (e.g., {"website": "https://example.com", "facebook": "https://facebook.com/example", "map": "https://www.openstreetmap.org/relation/1661399"})
    created_by TEXT NOT NULL, -- membership_number of the user who created the event
    project_id TEXT REFERENCES projects(id), -- optional association with a project
    country TEXT, -- ISO 3166-1 alpha-2 country code (e.g., "US", "TR", etc.)
    region TEXT, -- state/region or province within the country (e.g., "Istanbul", "Aleppo", "California" etc.)
    city TEXT, -- city of residence (e.g., "Fatih", "Al Bab", "Mezitli", "Azaz" etc.)
    address TEXT, -- detailed address for the event location (e.g., "123 Main St, Building A, Door 4") | can be "online" for online events
    -- required_skills TEXT, -- comma-separated list of skills required for the event (e.g., "python,project_management,design")
    -- recommended_skills TEXT, -- comma-separated list of skills recommended for the event (e.g., "python,project_management,design")
    -- aquired_skills TEXT, -- comma-separated list of skills that participants can acquire or improve by attending the event (e.g., "python,project_management,design")
    skills TEXT, -- JSON array of skill names required/recommended/aquired for the event (e.g., {"python": "required", "project_management": "recommended", "design": "aquired"} )
    telegram_group_id TEXT UNIQUE -- unique Telegram group ID associated with the event for communication and updates (e.g., "-123456789"), this will be stored and used by the bot
);

CREATE TRIGGER IF NOT EXISTS update_event_updated_at AFTER UPDATE ON events
BEGIN
    UPDATE events SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS event_tickets ( -- the available tickets for the events, 
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    point_price INTEGER NOT NULL, -- price in points (can be 0 for free tickets, negative for rewarding points to participants, and positive for charging points from participants)
    currency_price TEXT, -- price in currency (e.g., 10 $USD, 250 TRY, 10000 SYP, etc.)
    quantity INTEGER NOT NULL -- total quantity of this ticket type available for the event
);

CREATE TRIGGER IF NOT EXISTS update_event_ticket_updated_at AFTER UPDATE ON event_tickets
BEGIN
    UPDATE event_tickets SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS event_registrations ( -- the registrations of users to the events, each registration is for one ticket
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    membership_number TEXT NOT NULL, -- membership_number of the user who registered for the event
    ticket_id TEXT NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- "registered", "attended", "cancelled", "no_show"
    payment_approved_by TEXT, -- membership_number of the user who approved the payment (e.g., "1234567890")
    attendance_approved_by TEXT -- membership_number of the user who approved the attendance status (e.g., marking as attended, marking as no_show etc.)
);

CREATE TRIGGER IF NOT EXISTS update_event_registration_updated_at AFTER UPDATE ON event_registrations
BEGIN
    UPDATE event_registrations SET updated_at = datetime('now') WHERE id = NEW.id;
END;


CREATE TABLE IF NOT EXISTS skills (
    name TEXT NOT NULL UNIQUE, -- skill name, must be lowercase, without spaces and latin characters only (e.g., "python", "project_management", "design")
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT,
    members INT, -- number of members who have this skill
    events INT, -- number of events that require or recommend this skill
    tasks INT -- number of tasks that require this skill
);

CREATE TRIGGER IF NOT EXISTS update_skill_updated_at AFTER UPDATE ON skills
BEGIN
    UPDATE skills SET updated_at = datetime('now') WHERE name = NEW.name;
END;

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
