-- Upgrade for databases that applied main.sql before guest event registration existed.
-- Fresh installs that bootstrap from current main.sql should mark this migration as applied instead of running it.

ALTER TABLE events ADD COLUMN allow_guest_registration INTEGER NOT NULL DEFAULT 0;

CREATE TABLE event_registrations_new (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    membership_number TEXT,
    ticket_id TEXT NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    payment_approved_by TEXT,
    attendance_approved_by TEXT,
    guest_email TEXT,
    guest_name TEXT,
    guest_phone TEXT,
    UNIQUE (event_id, membership_number)
);

INSERT INTO event_registrations_new (
    id,
    created_at,
    updated_at,
    event_id,
    membership_number,
    ticket_id,
    status,
    payment_approved_by,
    attendance_approved_by
)
SELECT
    id,
    created_at,
    updated_at,
    event_id,
    membership_number,
    ticket_id,
    status,
    payment_approved_by,
    attendance_approved_by
FROM event_registrations;

DROP TABLE event_registrations;
ALTER TABLE event_registrations_new RENAME TO event_registrations;

CREATE TRIGGER IF NOT EXISTS update_event_registration_updated_at AFTER UPDATE ON event_registrations
BEGIN
    UPDATE event_registrations SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_registrations_event_guest_email
    ON event_registrations (event_id, guest_email)
    WHERE guest_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_registrations_guest_email
    ON event_registrations (guest_email)
    WHERE guest_email IS NOT NULL AND membership_number IS NULL;
