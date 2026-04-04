import type { D1DatabaseLike } from '../types/bindings'

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

export interface AgeDistributionItem {
  age: number
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
        age: typeof item.age === 'number' ? item.age : Number(item.age),
        count: typeof item.count === 'number' ? item.count : Number(item.count),
      }))
      .filter((item) => Number.isFinite(item.age) && Number.isFinite(item.count) && item.age >= 0 && item.count >= 0)
  } catch {
    return []
  }
}

export async function getMemberStats(db: D1DatabaseLike, membershipNumberPrefix: string): Promise<MemberStats> {
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
      `WITH age_counts AS (
        SELECT
          CAST((julianday('now') - julianday(date_of_birth)) / 365.2425 AS INTEGER) AS age,
          COUNT(*) AS member_count
        FROM user_info
        WHERE
          date_of_birth IS NOT NULL
          AND TRIM(date_of_birth) <> ''
          AND julianday(date_of_birth) IS NOT NULL
          AND julianday(date_of_birth) <= julianday('now')
        GROUP BY age
        ORDER BY age
      )
      SELECT COALESCE(json_group_array(json_object('age', age, 'count', member_count)), '[]') AS age_distribution
      FROM age_counts`
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