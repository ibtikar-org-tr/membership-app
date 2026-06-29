ALTER TABLE event_tickets ADD COLUMN active_registration_count INTEGER NOT NULL DEFAULT 0;

UPDATE event_tickets
SET active_registration_count = (
  SELECT COUNT(*)
  FROM event_registrations er
  WHERE er.ticket_id = event_tickets.id
    AND er.status IN ('registered', 'attended')
);
