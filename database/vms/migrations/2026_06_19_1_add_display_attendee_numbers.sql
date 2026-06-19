-- Upgrade for databases that applied main.sql before display_attendee_numbers existed.
-- Fresh installs that bootstrap from current main.sql should mark this migration as applied instead of running it.
ALTER TABLE events ADD COLUMN display_attendee_numbers INTEGER NOT NULL DEFAULT 1;
