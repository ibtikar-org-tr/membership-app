import type { D1DatabaseLike } from '../types/bindings'
import { getStatsCache, isStatsCacheStale, upsertStatsCache } from './stats-cache.repository'

const MEMBER_STATS_KEY = 'member_stats'

interface MemberStatsBaseRow {
  total_members: number | null
  new_members: number | null
  telegram_active: number | null
  total_countries: number | null
  total_universities: number | null
  male_count: number | null
  female_count: number | null
}

interface AgeDistributionRow {
  age_distribution: string | null
}

interface MemberStatsCachePayload extends MemberStats {
  membershipNumberPrefix: string
}

export interface AgeDistributionItem {
  group: string
  count: number
}

export interface MemberStats {
  totalMembers: number
  cycleGrowthPercentage: number
  telegramActive: number
  newMembers: number
  countriesCount: number
  universitiesCount: number
  maleCount: number
  femaleCount: number
  malePercentage: number
  femalePercentage: number
  ageDistribution: AgeDistributionItem[]
}

function toSafeNumber(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return value
}

function toRoundedPercentage(value: number): number {
  return Math.round(value * 100) / 100
}

function parseAgeDistribution(raw: string | null): AgeDistributionItem[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => ({
        group: typeof item.group === 'string' ? item.group : '',
        count: typeof item.count === 'number' ? item.count : Number(item.count),
      }))
      .filter((item) => item.group.length > 0 && Number.isFinite(item.count) && item.count >= 0)
  } catch {
    return []
  }
}

function parseAgeDistributionItems(value: unknown): AgeDistributionItem[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      const group = typeof record.group === 'string' ? record.group.trim() : ''
      const count = typeof record.count === 'number' ? record.count : Number(record.count)

      if (!group || !Number.isFinite(count) || count < 0) {
        return null
      }

      return { group, count }
    })
    .filter((item): item is AgeDistributionItem => item !== null)

  return items
}

function parseMemberStatsCache(raw: string | null, membershipNumberPrefix: string): MemberStats | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    if (parsed.membershipNumberPrefix !== membershipNumberPrefix) {
      return null
    }

    const ageDistribution = parseAgeDistributionItems(parsed.ageDistribution)
    if (!ageDistribution) {
      return null
    }

    return {
      totalMembers: toSafeNumber(parsed.totalMembers as number | null | undefined),
      cycleGrowthPercentage: toSafeNumber(parsed.cycleGrowthPercentage as number | null | undefined),
      telegramActive: toSafeNumber(parsed.telegramActive as number | null | undefined),
      newMembers: toSafeNumber(parsed.newMembers as number | null | undefined),
      countriesCount: toSafeNumber(parsed.countriesCount as number | null | undefined),
      universitiesCount: toSafeNumber(parsed.universitiesCount as number | null | undefined),
      maleCount: toSafeNumber(parsed.maleCount as number | null | undefined),
      femaleCount: toSafeNumber(parsed.femaleCount as number | null | undefined),
      malePercentage: toSafeNumber(parsed.malePercentage as number | null | undefined),
      femalePercentage: toSafeNumber(parsed.femalePercentage as number | null | undefined),
      ageDistribution,
    }
  } catch {
    return null
  }
}

export async function computeMemberStats(db: D1DatabaseLike, membershipNumberPrefix: string): Promise<MemberStats> {
  const baseRow = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM users) AS total_members,
        (SELECT COUNT(*) FROM users WHERE membership_number LIKE ?) AS new_members,
        (SELECT COUNT(*) FROM user_info WHERE telegram_id IS NOT NULL AND TRIM(telegram_id) <> '') AS telegram_active,
        (SELECT COUNT(DISTINCT country) FROM user_info WHERE country IS NOT NULL AND TRIM(country) <> '') AS total_countries,
        (SELECT COUNT(DISTINCT school) FROM user_info WHERE school IS NOT NULL AND TRIM(school) <> '') AS total_universities,
        (SELECT COUNT(*) FROM user_info WHERE sex = 'male') AS male_count`
    )
    .bind(`${membershipNumberPrefix}%`)
    .first<MemberStatsBaseRow>()

  const ageDistributionRow = await db
    .prepare(
      `WITH member_ages AS (
        SELECT CAST((julianday('now') - julianday(date_of_birth)) / 365.2425 AS INTEGER) AS age
        FROM user_info
        WHERE
          date_of_birth IS NOT NULL
          AND TRIM(date_of_birth) <> ''
          AND julianday(date_of_birth) IS NOT NULL
          AND julianday(date_of_birth) <= julianday('now')
      ),
      grouped AS (
        SELECT
          CASE
            WHEN age BETWEEN 15 AND 18 THEN '15-18'
            WHEN age BETWEEN 19 AND 22 THEN '19-22'
            WHEN age BETWEEN 23 AND 26 THEN '23-26'
            WHEN age BETWEEN 27 AND 30 THEN '27-30'
            WHEN age BETWEEN 31 AND 35 THEN '31-35'
            WHEN age > 35 THEN '36+'
            ELSE NULL
          END AS age_group,
          COUNT(*) AS member_count
        FROM member_ages
        GROUP BY age_group
      ),
      ordered_groups AS (
        SELECT age_group, member_count
        FROM grouped
        WHERE age_group IS NOT NULL
        ORDER BY CASE age_group
          WHEN '15-18' THEN 1
          WHEN '19-22' THEN 2
          WHEN '23-26' THEN 3
          WHEN '27-30' THEN 4
          WHEN '31-35' THEN 5
          WHEN '36+' THEN 6
          ELSE 99
        END
      )
      SELECT COALESCE(json_group_array(json_object('group', age_group, 'count', member_count)), '[]') AS age_distribution
      FROM ordered_groups`
    )
    .bind()
    .first<AgeDistributionRow>()

  const totalMembers = toSafeNumber(baseRow?.total_members)
  const newMembers = toSafeNumber(baseRow?.new_members)
  const telegramActive = toSafeNumber(baseRow?.telegram_active)
  const countriesCount = toSafeNumber(baseRow?.total_countries)
  const universitiesCount = toSafeNumber(baseRow?.total_universities)
  const maleCount = toSafeNumber(baseRow?.male_count)
  const femaleCount = totalMembers - maleCount

  return {
    totalMembers,
    cycleGrowthPercentage: totalMembers === 0 ? 0 : toRoundedPercentage((newMembers / totalMembers) * 100),
    telegramActive,
    newMembers,
    countriesCount,
    universitiesCount,
    maleCount,
    femaleCount,
    malePercentage: totalMembers === 0 ? 0 : toRoundedPercentage((maleCount / totalMembers) * 100),
    femalePercentage: totalMembers === 0 ? 0 : toRoundedPercentage((femaleCount / totalMembers) * 100),
    ageDistribution: parseAgeDistribution(ageDistributionRow?.age_distribution ?? null),
  }
}

export async function getMemberStats(
  logsDb: D1DatabaseLike,
  membersDb: D1DatabaseLike,
  membershipNumberPrefix: string,
): Promise<MemberStats> {
  const cached = await getStatsCache(logsDb, MEMBER_STATS_KEY)
  const parsed = cached ? parseMemberStatsCache(cached.content_json, membershipNumberPrefix) : null

  if (cached && parsed && !isStatsCacheStale(cached.updated_at)) {
    return parsed
  }

  const computed = await computeMemberStats(membersDb, membershipNumberPrefix)
  const payload: MemberStatsCachePayload = {
    membershipNumberPrefix,
    ...computed,
  }

  await upsertStatsCache(logsDb, MEMBER_STATS_KEY, payload)
  return computed
}
