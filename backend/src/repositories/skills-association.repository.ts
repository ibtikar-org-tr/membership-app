import type { D1DatabaseLike } from '../types/bindings'
import { getOrCreateSkillByName } from './vms-skills.repository'

export type AssociatedSkillType = 'project' | 'event' | 'task' | 'position' | 'club'

interface SkillAssociationRow {
  skill_name: string
  skill_level: string | null
}

function toSkillMap(rows: SkillAssociationRow[]): Record<string, string> | null {
  if (rows.length === 0) {
    return null
  }

  return Object.fromEntries(rows.map((row) => [row.skill_name, row.skill_level ?? 'required']))
}

export async function getAssociatedSkills(
  db: D1DatabaseLike,
  associatedType: AssociatedSkillType,
  associatedId: string,
): Promise<Record<string, string> | null> {
  const result = await db
    .prepare(
      `SELECT s.name AS skill_name, sa.skill_level
       FROM skills_association sa
       JOIN skills s ON s.id = sa.skill_id
       WHERE sa.associated_type = ? AND sa.associated_id = ?
       ORDER BY s.name ASC`,
    )
    .bind(associatedType, associatedId)
    .all<SkillAssociationRow>()

  return toSkillMap(result.results)
}

export async function replaceAssociatedSkills(
  db: D1DatabaseLike,
  associatedType: AssociatedSkillType,
  associatedId: string,
  skills?: Record<string, string> | null,
): Promise<void> {
  if (skills === undefined) {
    return
  }

  await db
    .prepare('DELETE FROM skills_association WHERE associated_type = ? AND associated_id = ?')
    .bind(associatedType, associatedId)
    .run()

  const entries = Object.entries(skills ?? {})
    .map(([name, level]) => [name.trim(), level.trim()] as const)
    .filter(([name]) => Boolean(name))

  if (entries.length === 0) {
    return
  }

  for (const [skillName, skillLevel] of entries) {
    const skill = await getOrCreateSkillByName(db, skillName)

    await db
      .prepare(
        `INSERT INTO skills_association (skill_id, associated_id, associated_type, skill_level)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(skill.id, associatedId, associatedType, skillLevel || null)
      .run()
  }
}