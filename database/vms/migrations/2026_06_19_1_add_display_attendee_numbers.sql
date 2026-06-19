-- Upgrade for databases that applied main.sql before display_attendee_numbers existed.
-- Fresh installs receive this column from main.sql; IF NOT EXISTS makes this a no-op there.
ALTER TABLE events ADD COLUMN IF NOT EXISTS display_attendee_numbers INTEGER NOT NULL DEFAULT 1;
