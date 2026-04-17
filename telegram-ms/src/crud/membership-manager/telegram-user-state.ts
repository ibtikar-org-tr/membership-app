import { Environment, TelegramUserState } from '../../types';
import { D1DatabaseConnection } from '../database';

export class TelegramUserStateService {
  private db: D1DatabaseConnection;

  constructor(env: Environment) {
    this.db = new D1DatabaseConnection(env.TELEGRAM_DB);
  }

  async getUserState(telegramId: string): Promise<TelegramUserState | null> {
    try {
      const query = `
        SELECT telegram_id, state, notes, created_at, modified_at
        FROM telegram_user_states
        WHERE telegram_id = ?
          AND datetime(modified_at, '+10 minutes') > datetime('now')
      `;

      return await this.db.prepare(query).bind(telegramId).first<TelegramUserState>();
    } catch (error) {
      console.error('Error getting user state:', error);
      return null;
    }
  }

  async setUserState(telegramId: string, state: string, notes?: string): Promise<boolean> {
    try {
      const query = `
        INSERT OR REPLACE INTO telegram_user_states (telegram_id, state, notes, created_at, modified_at)
        VALUES (?, ?, ?, COALESCE((SELECT created_at FROM telegram_user_states WHERE telegram_id = ?), datetime('now')), datetime('now'))
      `;

      const result = await this.db.prepare(query).bind(telegramId, state, notes || null, telegramId).run();
      return result.success;
    } catch (error) {
      console.error('Error setting user state:', error);
      return false;
    }
  }

  async clearUserState(telegramId: string): Promise<boolean> {
    return this.setUserState(telegramId, 'normal');
  }

  async getUserStateValue(telegramId: string): Promise<string> {
    const userState = await this.getUserState(telegramId);
    return userState?.state || 'normal';
  }

  async getUserStateNotes(telegramId: string): Promise<string | null> {
    const userState = await this.getUserState(telegramId);
    return userState?.notes || null;
  }
}
