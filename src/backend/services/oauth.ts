import { Database } from '../models/database';
import { OAuthClient, User } from '../models/types';
import bcrypt from 'bcryptjs';

export interface OAuthTokenPayload {
  sub: string; // user_id
  membership_number: string;
  email: string;
  role: string;
  client_id: string;
  iat: number;
  exp: number;
}

export class OAuthService {
  constructor(
    private db: Database,
    private jwtSecret: string
  ) {}

  /**
   * Generate OAuth access token using JWT
   * @param user User object
   * @param clientId OAuth client ID
   * @param expiresInSeconds Token expiration time in seconds (default 1 hour)
   */
  async generateAccessToken(
    user: User,
    clientId: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: OAuthTokenPayload = {
      sub: user.id,
      membership_number: user.membership_number,
      email: user.email,
      role: user.role,
      client_id: clientId,
      iat: now,
      exp: now + expiresInSeconds,
    };

    // Create JWT token
    const token = await this.createJWT(payload, this.jwtSecret);

    // Store token in database for auditing
    await this.db.createOAuthToken({
      client_id: clientId,
      user_id: user.id,
      expires_at: new Date((now + expiresInSeconds) * 1000).toISOString(),
    });

    return token;
  }

  /**
   * Verify and decode OAuth access token
   */
  async verifyAccessToken(token: string): Promise<OAuthTokenPayload | null> {
    try {
      const payload = await this.verifyJWT(token, this.jwtSecret);
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Authenticate OAuth client credentials
   */
  async authenticateClient(clientId: string, clientSecret: string): Promise<OAuthClient | null> {
    const client = await this.db.getOAuthClientByClientId(clientId);
    if (!client) {
      return null;
    }

    const isValid = await bcrypt.compare(clientSecret, client.client_secret_hash);
    if (!isValid) {
      return null;
    }

    return client;
  }

  /**
   * Create JWT token
   */
  private async createJWT(payload: OAuthTokenPayload, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    
    // Create header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

    // Create signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data)
    );

    const encodedSignature = this.base64UrlEncode(signature);

    return `${data}.${encodedSignature}`;
  }

  /**
   * Verify JWT token
   */
  private async verifyJWT(token: string, secret: string): Promise<OAuthTokenPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = this.base64UrlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(data)
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payload = JSON.parse(this.base64UrlDecodeToString(encodedPayload));
    return payload as OAuthTokenPayload;
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(input: string | ArrayBuffer): string {
    let base64: string;
    
    if (typeof input === 'string') {
      base64 = btoa(input);
    } else {
      const bytes = new Uint8Array(input);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binary);
    }

    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode to ArrayBuffer
   */
  private base64UrlDecode(input: string): ArrayBuffer {
    let base64 = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * Base64 URL decode to string
   */
  private base64UrlDecodeToString(input: string): string {
    let base64 = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    return atob(base64);
  }
}
