-- Upgrade for databases that applied main.sql before display_attendee_numbers existed.
-- Fresh installs receive this column from main.sql; this migration is a no-op when the column is already present.
ALTER TABLE events ADD COLUMN display_attendee_numbers INTEGER NOT NULL DEFAULT 1;
