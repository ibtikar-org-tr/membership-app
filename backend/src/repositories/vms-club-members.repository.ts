import type {
  CreateClubMembershipInput,
  UpdateClubMembershipInput,
} from '../schemas/vms-club.schema'
import type { D1DatabaseLike } from '../types/bindings'

interface ClubMemberRow {
  club_id: string
  membership_number: string
  status: string
}

export interface ClubMemberRecord {
  clubId: string
  membershipNumber: string
  status: string
  displayName: string
}

function mapClubMemberRow(row: ClubMemberRow): ClubMemberRecord {
  return {
    clubId: row.club_id,
    membershipNumber: row.membership_number,
    status: row.status,
    displayName: row.membership_number,
  }
}

export async function listClubMembers(db: D1DatabaseLike, clubId?: string, status?: string) {
  if (clubId && status) {
    const result = await db
      .prepare(
        'SELECT club_id, membership_number, status FROM club_members WHERE club_id = ? AND status = ? ORDER BY membership_number ASC',
      )
      .bind(clubId, status)
      .all<ClubMemberRow>()

    return result.results.map(mapClubMemberRow)
  }

  if (clubId) {
    const result = await db
      .prepare('SELECT club_id, membership_number, status FROM club_members WHERE club_id = ? ORDER BY membership_number ASC')
      .bind(clubId)
      .all<ClubMemberRow>()

    return result.results.map(mapClubMemberRow)
  }

  if (status) {
    const result = await db
      .prepare('SELECT club_id, membership_number, status FROM club_members WHERE status = ? ORDER BY club_id ASC, membership_number ASC')
      .bind(status)
      .all<ClubMemberRow>()

    return result.results.map(mapClubMemberRow)
  }

  const result = await db
    .prepare('SELECT club_id, membership_number, status FROM club_members ORDER BY club_id ASC, membership_number ASC')
    .bind()
    .all<ClubMemberRow>()

  return result.results.map(mapClubMemberRow)
}

export async function getClubMember(db: D1DatabaseLike, clubId: string, membershipNumber: string) {
  const row = await db
    .prepare('SELECT club_id, membership_number, status FROM club_members WHERE club_id = ? AND membership_number = ?')
    .bind(clubId, membershipNumber)
    .first<ClubMemberRow>()

  return row ? mapClubMemberRow(row) : null
}

export async function createClubMember(db: D1DatabaseLike, input: CreateClubMembershipInput, status: string) {
  await db
    .prepare('INSERT INTO club_members (club_id, membership_number, status) VALUES (?, ?, ?)')
    .bind(input.clubId, input.membershipNumber, status)
    .run()

  return getClubMember(db, input.clubId, input.membershipNumber)
}

export async function updateClubMember(
  db: D1DatabaseLike,
  clubId: string,
  membershipNumber: string,
  input: UpdateClubMembershipInput,
) {
  await db
    .prepare('UPDATE club_members SET status = ? WHERE club_id = ? AND membership_number = ?')
    .bind(input.status, clubId, membershipNumber)
    .run()

  return getClubMember(db, clubId, membershipNumber)
}

export async function deleteClubMember(db: D1DatabaseLike, clubId: string, membershipNumber: string) {
  const existing = await getClubMember(db, clubId, membershipNumber)

  if (!existing) {
    return false
  }

  await db.prepare('DELETE FROM club_members WHERE club_id = ? AND membership_number = ?').bind(clubId, membershipNumber).run()
  return true
}
