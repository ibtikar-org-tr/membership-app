import { PasswordResetRequest, GoogleForm, GoogleSheet, Log } from './types';

export class Database {
  constructor(private db: D1Database) {}

  // Password Reset Request operations
  async createPasswordResetRequest(request: Omit<PasswordResetRequest, 'id' | 'created_at' | 'updated_at'>): Promise<PasswordResetRequest> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const fullRequest: PasswordResetRequest = {
      ...request,
      id,
      created_at: now,
      updated_at: now
    };

    await this.db.prepare(`
      INSERT INTO password_reset_request (id, membership_number, email, created_at, updated_at, status, token)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `).bind(
      fullRequest.id,
      fullRequest.membership_number,
      fullRequest.email,
      fullRequest.created_at,
      fullRequest.updated_at,
      fullRequest.status,
      fullRequest.token
    ).run();

    return fullRequest;
  }

  async getPasswordResetRequestByToken(token: string): Promise<PasswordResetRequest | null> {
    const result = await this.db.prepare(`
      SELECT * FROM password_reset_request WHERE token = ?1 AND status = 'pending'
    `).bind(token).first();
    
    return result as PasswordResetRequest | null;
  }

  async updatePasswordResetRequestStatus(id: string, status: PasswordResetRequest['status']): Promise<void> {
    const now = new Date().toISOString();
    
    await this.db.prepare(`
      UPDATE password_reset_request 
      SET status = ?1, updated_at = ?2 
      WHERE id = ?3
    `).bind(status, now, id).run();
  }

  // Google Form operations
  async createOrUpdateGoogleForm(formData: Omit<GoogleForm, 'id' | 'created_at' | 'updated_at'>): Promise<GoogleForm> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const form: GoogleForm = {
      ...formData,
      id,
      created_at: now,
      updated_at: now
    };

    await this.db.prepare(`
      INSERT OR REPLACE INTO google_form (id, google_form_id, created_at, updated_at, corresponding_values)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(
      form.id,
      form.google_form_id,
      form.created_at,
      form.updated_at,
      JSON.stringify(form.corresponding_values)
    ).run();

    return form;
  }

  async getGoogleForm(): Promise<GoogleForm | null> {
    const result = await this.db.prepare(`
      SELECT * FROM google_form ORDER BY created_at DESC LIMIT 1
    `).first();
    
    if (result) {
      return {
        ...result,
        corresponding_values: JSON.parse(result.corresponding_values as string)
      } as GoogleForm;
    }
    
    return null;
  }

  // Google Sheet operations
  async createOrUpdateGoogleSheet(sheetData: Omit<GoogleSheet, 'id' | 'created_at' | 'updated_at'>): Promise<GoogleSheet> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const sheet: GoogleSheet = {
      ...sheetData,
      id,
      created_at: now,
      updated_at: now
    };

    await this.db.prepare(`
      INSERT OR REPLACE INTO google_sheet (id, google_sheet_id, created_at, updated_at, corresponding_values)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(
      sheet.id,
      sheet.google_sheet_id,
      sheet.created_at,
      sheet.updated_at,
      JSON.stringify(sheet.corresponding_values)
    ).run();

    return sheet;
  }

  async getGoogleSheet(): Promise<GoogleSheet | null> {
    const result = await this.db.prepare(`
      SELECT * FROM google_sheet ORDER BY created_at DESC LIMIT 1
    `).first();
    
    if (result) {
      return {
        ...result,
        corresponding_values: JSON.parse(result.corresponding_values as string)
      } as GoogleSheet;
    }
    
    return null;
  }

  // Logs operations
  async createLog(logData: Omit<Log, 'id' | 'created_at'>): Promise<Log> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const log: Log = {
      ...logData,
      id,
      created_at: now
    };

    await this.db.prepare(`
      INSERT INTO logs (id, user, action, status, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(
      log.id,
      log.user,
      log.action,
      log.status,
      log.created_at
    ).run();

    return log;
  }

  async getLogs(limit: number = 100, offset: number = 0): Promise<Log[]> {
    const results = await this.db.prepare(`
      SELECT * FROM logs ORDER BY created_at DESC LIMIT ?1 OFFSET ?2
    `).bind(limit, offset).all();
    
    return results.results as Log[];
  }

  async getLogsByUser(user: string, limit: number = 100): Promise<Log[]> {
    const results = await this.db.prepare(`
      SELECT * FROM logs WHERE user = ?1 ORDER BY created_at DESC LIMIT ?2
    `).bind(user, limit).all();
    
    return results.results as Log[];
  }
}
