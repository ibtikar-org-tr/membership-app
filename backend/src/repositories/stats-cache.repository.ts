import type { D1DatabaseLike } from '../types/bindings'

export const STATS_CACHE_STALE_MS = 24 * 60 * 60 * 1000

export interface StatsCacheRow {
  updated_at: string
  content_json: string
}

export function isStatsCacheStale(updatedAt: string | null | undefined, maxAgeMs = STATS_CACHE_STALE_MS, now = Date.now()): boolean {
  if (!updatedAt?.trim()) {
    return true
  }

  const updatedMs = new Date(updatedAt).getTime()
  if (Number.isNaN(updatedMs)) {
    return true
  }

  return now - updatedMs >= maxAgeMs
}

export async function getStatsCache(db: D1DatabaseLike, key: string): Promise<StatsCacheRow | null> {
  const row = await db
    .prepare('SELECT updated_at, content_json FROM stats WHERE key = ?')
    .bind(key)
    .first<StatsCacheRow>()

  return row ?? null
}

export async function upsertStatsCache(db: D1DatabaseLike, key: string, content: unknown): Promise<void> {
  await db
    .prepare(
      `INSERT INTO stats (key, updated_at, content_json)
       VALUES (?, datetime('now'), ?)
       ON CONFLICT(key) DO UPDATE SET
         updated_at = datetime('now'),
         content_json = excluded.content_json`,
    )
    .bind(key, JSON.stringify(content))
    .run()
}
