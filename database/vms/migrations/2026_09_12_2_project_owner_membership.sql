-- Mirror projects.owner into project_members as role=owner.
-- 1) Promote existing member rows for current owners.
UPDATE project_members
SET role = 'owner'
WHERE EXISTS (
  SELECT 1
  FROM projects
  WHERE projects.id = project_members.project_id
    AND projects.owner = project_members.membership_number
);

-- 2) Insert missing owner membership rows.
INSERT OR IGNORE INTO project_members (project_id, membership_number, role)
SELECT id, owner, 'owner'
FROM projects;
