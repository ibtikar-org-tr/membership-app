import {
  PasswordResetRequest,
  GoogleFormSheet,
  GoogleSheet,
  Log,
  User,
  PendingSignup,
  Session,
  OAuthClient,
  OAuthToken,
  SheetSyncState,
} from './types';

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
  async createOrUpdateGoogleFormSheet(formData: Omit<GoogleFormSheet, 'id' | 'created_at' | 'updated_at'>): Promise<GoogleFormSheet> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const formSheet: GoogleFormSheet = {
      ...formData,
      id,
      created_at: now,
      updated_at: now
    };

    await this.db.prepare(`
      INSERT OR REPLACE INTO google_form_sheet (id, google_form_sheet_id, created_at, updated_at, corresponding_values, auto_note_column)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `).bind(
      formSheet.id,
      formSheet.google_form_sheet_id,
      formSheet.created_at,
      formSheet.updated_at,
      JSON.stringify(formSheet.corresponding_values),
      formSheet.auto_note_column || null
    ).run();

    return formSheet;
  }

  async getGoogleFormSheet(): Promise<GoogleFormSheet | null> {
    const result = await this.db.prepare(`
      SELECT * FROM google_form_sheet ORDER BY created_at DESC LIMIT 1
    `).first();
    
    if (result) {
      return {
        id: result.id,
        google_form_sheet_id: result.google_form_sheet_id, // Map database column to TypeScript property
        created_at: result.created_at,
        updated_at: result.updated_at,
        corresponding_values: JSON.parse(result.corresponding_values as string),
        auto_note_column: result.auto_note_column as string || undefined
      } as GoogleFormSheet;
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

  // User operations (canonical auth users)
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const fullUser: User = {
      ...userData,
      id,
      created_at: now,
      updated_at: now,
    };

    await this.db
      .prepare(
        `
      INSERT INTO users (id, membership_number, email, password_hash, role, status, latin_name, phone, whatsapp, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
    `,
      )
      .bind(
        fullUser.id,
        fullUser.membership_number,
        fullUser.email,
        fullUser.password_hash,
        fullUser.role,
        fullUser.status,
        fullUser.latin_name || null,
        fullUser.phone || null,
        fullUser.whatsapp || null,
        fullUser.created_at,
        fullUser.updated_at,
      )
      .run();

    return fullUser;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM users WHERE email = ?1
    `,
      )
      .bind(email)
      .first();

    return result as User | null;
  }

  async getUserByMembershipNumber(membershipNumber: string): Promise<User | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM users WHERE membership_number = ?1
    `,
      )
      .bind(membershipNumber)
      .first();

    return result as User | null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM users WHERE id = ?1
    `,
      )
      .bind(id)
      .first();

    return result as User | null;
  }

  async updateUserStatus(id: string, status: User['status']): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `
      UPDATE users SET status = ?1, updated_at = ?2 WHERE id = ?3
    `,
      )
      .bind(status, now, id)
      .run();
  }

  // Pending signup operations
  async createPendingSignup(data: Omit<PendingSignup, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<PendingSignup> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const full: PendingSignup = {
      ...data,
      id,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    await this.db
      .prepare(
        `
      INSERT INTO pending_signups (id, email, requested_membership_number, data, status, approval_token, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `,
      )
      .bind(
        full.id,
        full.email,
        full.requested_membership_number || null,
        JSON.stringify(full.data),
        full.status,
        full.approval_token,
        full.created_at,
        full.updated_at,
      )
      .run();

    return full;
  }

  async getPendingSignupByToken(token: string): Promise<PendingSignup | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM pending_signups WHERE approval_token = ?1
    `,
      )
      .bind(token)
      .first();

    if (!result) return null;

    return {
      ...result,
      data: JSON.parse(result.data as string),
    } as PendingSignup;
  }

  async getPendingSignups(): Promise<PendingSignup[]> {
    const results = await this.db
      .prepare(
        `
      SELECT * FROM pending_signups WHERE status = 'pending' ORDER BY created_at ASC
    `,
      )
      .all();

    return (results.results || []).map((row: any) => ({
      ...row,
      data: JSON.parse(row.data as string),
    })) as PendingSignup[];
  }

  async updatePendingSignupStatus(id: string, status: PendingSignup['status']): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `
      UPDATE pending_signups SET status = ?1, updated_at = ?2 WHERE id = ?3
    `,
      )
      .bind(status, now, id)
      .run();
  }

  // Session operations
  async createSession(session: Omit<Session, 'created_at' | 'last_seen_at'>): Promise<Session> {
    const now = new Date().toISOString();
    const full: Session = {
      ...session,
      created_at: now,
      last_seen_at: now,
    };

    await this.db
      .prepare(
        `
      INSERT INTO sessions (id, user_id, ip, user_agent, created_at, last_seen_at, expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `,
      )
      .bind(
        full.id,
        full.user_id,
        full.ip || null,
        full.user_agent || null,
        full.created_at,
        full.last_seen_at,
        full.expires_at,
      )
      .run();

    return full;
  }

  async getSession(id: string): Promise<Session | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM sessions WHERE id = ?1
    `,
      )
      .bind(id)
      .first();

    return result as Session | null;
  }

  async touchSession(id: string, newLastSeen: string, newExpiresAt?: string): Promise<void> {
    if (newExpiresAt) {
      await this.db
        .prepare(
          `
        UPDATE sessions SET last_seen_at = ?1, expires_at = ?2 WHERE id = ?3
      `,
        )
        .bind(newLastSeen, newExpiresAt, id)
        .run();
    } else {
      await this.db
        .prepare(
          `
        UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2
      `,
        )
        .bind(newLastSeen, id)
        .run();
    }
  }

  async deleteSession(id: string): Promise<void> {
    await this.db
      .prepare(
        `
      DELETE FROM sessions WHERE id = ?1
    `,
      )
      .bind(id)
      .run();
  }

  async deleteExpiredSessions(nowIso: string): Promise<void> {
    await this.db
      .prepare(
        `
      DELETE FROM sessions WHERE expires_at <= ?1
    `,
      )
      .bind(nowIso)
      .run();
  }

  // OAuth client operations
  async createOAuthClient(client: Omit<OAuthClient, 'id' | 'created_at' | 'updated_at'>): Promise<OAuthClient> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const full: OAuthClient = {
      ...client,
      id,
      created_at: now,
      updated_at: now,
    };

    await this.db
      .prepare(
        `
      INSERT INTO oauth_clients (id, client_id, client_secret_hash, name, allowed_ips, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `,
      )
      .bind(
        full.id,
        full.client_id,
        full.client_secret_hash,
        full.name,
        full.allowed_ips || null,
        full.created_at,
        full.updated_at,
      )
      .run();

    return full;
  }

  async getOAuthClientByClientId(clientId: string): Promise<OAuthClient | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM oauth_clients WHERE client_id = ?1
    `,
      )
      .bind(clientId)
      .first();

    return result as OAuthClient | null;
  }

  async getOAuthClientById(id: string): Promise<OAuthClient | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM oauth_clients WHERE id = ?1
    `,
      )
      .bind(id)
      .first();

    return result as OAuthClient | null;
  }

  async getAllOAuthClients(): Promise<OAuthClient[]> {
    const results = await this.db
      .prepare(
        `
      SELECT * FROM oauth_clients ORDER BY created_at DESC
    `,
      )
      .all();

    return results.results as OAuthClient[];
  }

  async updateOAuthClient(
    id: string,
    updates: Partial<Pick<OAuthClient, 'name' | 'allowed_ips'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    const client = await this.getOAuthClientById(id);

    if (!client) {
      throw new Error('OAuth client not found');
    }

    const name = updates.name ?? client.name;
    const allowed_ips = updates.allowed_ips !== undefined ? updates.allowed_ips : client.allowed_ips;

    await this.db
      .prepare(
        `
      UPDATE oauth_clients 
      SET name = ?1, allowed_ips = ?2, updated_at = ?3 
      WHERE id = ?4
    `,
      )
      .bind(name, allowed_ips || null, now, id)
      .run();
  }

  async deleteOAuthClient(id: string): Promise<void> {
    await this.db
      .prepare(
        `
      DELETE FROM oauth_clients WHERE id = ?1
    `,
      )
      .bind(id)
      .run();
  }

  // OAuth token operations (optional auditing)
  async createOAuthToken(token: Omit<OAuthToken, 'id' | 'created_at'>): Promise<OAuthToken> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const full: OAuthToken = {
      ...token,
      id,
      created_at: now,
    };

    await this.db
      .prepare(
        `
      INSERT INTO oauth_tokens (id, client_id, user_id, created_at, expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `,
      )
      .bind(full.id, full.client_id, full.user_id || null, full.created_at, full.expires_at)
      .run();

    return full;
  }

  // Sheet sync state operations
  async getSheetSyncState(): Promise<SheetSyncState | null> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM sheet_sync_state LIMIT 1
    `,
      )
      .first();

    return (result as SheetSyncState) || null;
  }

  async upsertSheetSyncState(state: Omit<SheetSyncState, 'id'>): Promise<SheetSyncState> {
    const existing = await this.getSheetSyncState();
    const id = existing?.id ?? 'default';

    const last_sync_at = state.last_sync_at ?? existing?.last_sync_at ?? null;
    const last_checkpoint = state.last_checkpoint ?? existing?.last_checkpoint ?? null;

    await this.db
      .prepare(
        `
      INSERT OR REPLACE INTO sheet_sync_state (id, last_sync_at, last_checkpoint)
      VALUES (?1, ?2, ?3)
    `,
      )
      .bind(id, last_sync_at, last_checkpoint)
      .run();

    return {
      id,
      last_sync_at,
      last_checkpoint,
    };
  }
}
