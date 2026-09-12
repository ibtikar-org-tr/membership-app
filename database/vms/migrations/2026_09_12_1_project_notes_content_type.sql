-- D1/SQLite: ADD COLUMN cannot use NOT NULL here; app treats NULL as 'html'.
ALTER TABLE project_notes ADD COLUMN content_type TEXT DEFAULT 'html';
