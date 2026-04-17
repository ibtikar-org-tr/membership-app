import { Environment } from '../../types';
import { Member } from '../../types/membership-manager';

interface MemberRow {
  membership_number: string;
  en_name: string | null;
  ar_name: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  telegram_id: string | null;
  telegram_username: string | null;
}

export class MemberSheetServices {
  private readonly db: D1Database;

  constructor(env: Environment) {
    this.db = env.MEMBERS_DB;
  }

  async getMembers(): Promise<Member[]> {
    const result = await this.db
      .prepare(
        `SELECT
          u.membership_number,
          ui.en_name,
          ui.ar_name,
          u.email,
          ui.phone_number AS phone,
          ui.phone_number AS whatsapp,
          ui.telegram_id,
          ui.telegram_username
        FROM users u
        LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
        ORDER BY u.membership_number ASC`
      )
      .all<MemberRow>();

    return (result.results || []).map((row) => this.toMember(row));
  }

  async getMemberByMembershipNumber(membershipNumber: string): Promise<Member | null> {
    const row = await this.db
      .prepare(
        `SELECT
          u.membership_number,
          ui.en_name,
          ui.ar_name,
          u.email,
          ui.phone_number AS phone,
          ui.phone_number AS whatsapp,
          ui.telegram_id,
          ui.telegram_username
        FROM users u
        LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
        WHERE u.membership_number = ?
        LIMIT 1`
      )
      .bind(membershipNumber)
      .first<MemberRow>();

    return row ? this.toMember(row) : null;
  }

  async getMemberByEmail(email: string): Promise<Member | null> {
    const row = await this.db
      .prepare(
        `SELECT
          u.membership_number,
          ui.en_name,
          ui.ar_name,
          u.email,
          ui.phone_number AS phone,
          ui.phone_number AS whatsapp,
          ui.telegram_id,
          ui.telegram_username
        FROM users u
        LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
        WHERE u.email = ?
        LIMIT 1`
      )
      .bind(email)
      .first<MemberRow>();

    return row ? this.toMember(row) : null;
  }

  async getMemberByTelegramId(telegramId: string): Promise<Member | null> {
    const row = await this.db
      .prepare(
        `SELECT
          u.membership_number,
          ui.en_name,
          ui.ar_name,
          u.email,
          ui.phone_number AS phone,
          ui.phone_number AS whatsapp,
          ui.telegram_id,
          ui.telegram_username
        FROM users u
        JOIN user_info ui ON ui.membership_number = u.membership_number
        WHERE ui.telegram_id = ?
        LIMIT 1`
      )
      .bind(telegramId)
      .first<MemberRow>();

    return row ? this.toMember(row) : null;
  }

  async updateMember(member: Pick<Member, 'membership_number' | 'telegram_id' | 'telegram_username'>): Promise<void> {
    await this.db
      .prepare(
        `UPDATE user_info
         SET telegram_id = ?, telegram_username = ?
         WHERE membership_number = ?`
      )
      .bind(member.telegram_id || null, member.telegram_username || null, member.membership_number)
      .run();
  }

  private toMember(row: MemberRow): Member {
    return {
      membership_number: row.membership_number,
      en_name: row.en_name || row.email || row.membership_number,
      ar_name: row.ar_name,
      email: row.email,
      phone: row.phone,
      whatsapp: row.whatsapp,
      telegram_id: row.telegram_id,
      telegram_username: row.telegram_username,
    };
  }
}
