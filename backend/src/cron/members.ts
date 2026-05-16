import type { AppBindings, D1DatabaseLike } from '../types/bindings'

export async function memberHasTelegram(
  membersDb: D1DatabaseLike,
  membershipNumber: string,
): Promise<boolean> {
  const row = await membersDb
    .prepare(
      'SELECT telegram_id FROM user_info WHERE membership_number = ? AND telegram_id IS NOT NULL AND trim(telegram_id) != \'\'',
    )
    .bind(membershipNumber)
    .first<{ telegram_id: string }>()

  return Boolean(row?.telegram_id)
}

export async function filterMembersWithTelegram(
  membersDb: D1DatabaseLike,
  membershipNumbers: string[],
): Promise<Set<string>> {
  const eligible = new Set<string>()

  if (membershipNumbers.length === 0) {
    return eligible
  }

  const unique = [...new Set(membershipNumbers)]

  for (const membershipNumber of unique) {
    if (await memberHasTelegram(membersDb, membershipNumber)) {
      eligible.add(membershipNumber)
    }
  }

  return eligible
}

export function getFrontendProjectUrl(bindings: AppBindings, projectId: string): string | null {
  const base = bindings.FRONTEND_BASE_URL?.trim().replace(/\/+$/, '')
  if (!base) {
    return null
  }

  return `${base}/dashboard/projects/${encodeURIComponent(projectId)}`
}

export function getFrontendEventUrl(bindings: AppBindings, eventId: string): string | null {
  const base = bindings.FRONTEND_BASE_URL?.trim().replace(/\/+$/, '')
  if (!base) {
    return null
  }

  return `${base}/dashboard/events/${encodeURIComponent(eventId)}`
}
