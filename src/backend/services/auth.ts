import { MemberInfo, User } from '../models/types';
import { GoogleAPIService } from './google-api';
import { Database } from '../models/database';
import bcrypt from 'bcryptjs';

export interface JWTPayload {
  membership_number: string;
  email: string;
  exp: number;
  iat: number;
}

export class AuthService {
  constructor(
    private db: Database,
    private googleService: GoogleAPIService,
    private jwtSecret: string
  ) {}

  async authenticateAdmin(password: string, adminPassword: string): Promise<boolean> {
    return password === adminPassword;
  }

  /**
   * Backward-compatible member authentication:
   * - First tries D1 users table with bcrypt hashes
   * - If user not found there, falls back to Google Sheet authentication
   *   and migrates the user into D1 with a hashed password on success.
   */
  async authenticateMember(identifier: string, password: string): Promise<{ user: User; member: MemberInfo } | null> {
    try {
      // 1) Try D1 users table first (canonical auth)
      let user = await this.db.getUserByEmail(identifier);
      if (!user) {
        user = await this.db.getUserByMembershipNumber(identifier);
      }

      if (user) {
        if (user.status !== 'active') {
          return null;
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
          return null;
        }

        // Load member profile from Google Sheet to keep existing behavior
        const member = await this.getMemberFromSheetByMembershipNumber(user.membership_number);
        if (!member) {
          // If D1 user exists but Sheet row is missing, still allow login but with minimal info
          const fallbackMember: MemberInfo = {
            membership_number: user.membership_number,
            ar_name: '',
            latin_name: user.latin_name || '',
            whatsapp: user.whatsapp || '',
            email: user.email,
            sex: '',
            birth_date: '',
            country: '',
            city: '',
            district: '',
            university: '',
            major: '',
            graduation_year: '',
            blood_type: '',
            password: '',
            phone: user.phone || '',
          };
          return { user, member: fallbackMember };
        }

        return { user, member };
      }

      // 2) Fallback: authenticate against Google Sheet (legacy members)
      const sheetConfig = await this.db.getGoogleSheet();
      if (!sheetConfig) {
        throw new Error('Google Sheet configuration not found');
      }

      const member = await this.googleService.findMemberByIdentifier(
        sheetConfig.google_sheet_id,
        identifier,
        sheetConfig.corresponding_values
      );

      if (!member || member.password !== password) {
        return null;
      }

      // 3) Migrate legacy member into D1 users with a bcrypt-hashed password
      const password_hash = await bcrypt.hash(password, 12);
      const migratedUser = await this.db.createUser({
        membership_number: member.membership_number,
        email: member.email,
        password_hash,
        role: 'member',
        status: 'active',
        latin_name: member.latin_name,
        phone: member.phone,
        whatsapp: member.whatsapp,
      });

      return { user: migratedUser, member };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async generatePasswordResetToken(membershipNumber: string, email: string): Promise<string> {
    const payload: JWTPayload = {
      membership_number: membershipNumber,
      email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      iat: Math.floor(Date.now() / 1000)
    };

    return this.createJWT(payload);
  }

  async verifyPasswordResetToken(token: string): Promise<JWTPayload | null> {
    try {
      return await this.verifyJWT(token);
    } catch (error) {
      return null;
    }
  }

  private async createJWT(payload: JWTPayload): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    // Create base64 encoded header and payload first
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // The data to sign should be the base64 encoded header.payload
    const encoder = new TextEncoder();
    const data = encoder.encode(`${headerBase64}.${payloadBase64}`);
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, data);
    
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    return `${headerBase64}.${payloadBase64}.${signatureBase64}`;
  }

  private async verifyJWT(token: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerBase64, payloadBase64, signatureBase64] = parts;
    
    try {
      // Add padding if needed for base64 decoding
      const addPadding = (base64: string) => {
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        return base64 + padding;
      };
      
      // Decode header and payload
      const headerForDecode = addPadding(headerBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payloadForDecode = addPadding(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      
      const header = JSON.parse(atob(headerForDecode));
      const payload = JSON.parse(atob(payloadForDecode));
      
      // Check expiry
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      // Verify signature
      const encoder = new TextEncoder();
      const data = encoder.encode(`${headerBase64}.${payloadBase64}`);
      
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.jwtSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      
      const signatureForDecode = addPadding(signatureBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const signature = Uint8Array.from(atob(signatureForDecode), c => c.charCodeAt(0));
      
      const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }
      
      return payload as JWTPayload;
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      throw new Error('Invalid token format');
    }
  }

  async updateMemberPassword(membershipNumber: string, newPassword: string): Promise<void> {
    // Get Google Sheet configuration
    const sheetConfig = await this.db.getGoogleSheet();
    if (!sheetConfig) {
      throw new Error('Google Sheet configuration not found');
    }

    // Update password in Google Sheets
    await this.googleService.updateMemberPassword(
      sheetConfig.google_sheet_id,
      membershipNumber,
      newPassword,
      sheetConfig.corresponding_values
    );
  }

  generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // Helper to load full member profile from Google Sheet by membership number
  private async getMemberFromSheetByMembershipNumber(membershipNumber: string): Promise<MemberInfo | null> {
    const sheetConfig = await this.db.getGoogleSheet();
    if (!sheetConfig) {
      return null;
    }

    const member = await this.googleService.findMemberByIdentifier(
      sheetConfig.google_sheet_id,
      membershipNumber,
      sheetConfig.corresponding_values
    );

    return member;
  }
}
