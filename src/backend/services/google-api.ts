import { MemberInfo } from '../models/types';

export interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export class GoogleAPIService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private credentials: GoogleCredentials) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.credentials.private_key_id,
    };

    const payload = {
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send',
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat: now,
    };

    // Create JWT token
    const jwt = await this.createJWT(header, payload, this.credentials.private_key);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }

  private async createJWT(header: any, payload: any, privateKey: string): Promise<string> {
    const encoder = new TextEncoder();
    
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const data = `${headerBase64}.${payloadBase64}`;
    
    // Import private key
    const key = await crypto.subtle.importKey(
      'pkcs8',
      this.pemToArrayBuffer(privateKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(data));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    return `${data}.${signatureBase64}`;
  }

  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s+/g, '');
    
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Google Sheets API
  async getSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
    const token = await this.getAccessToken();
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data.values || [];
  }

  async updateSheetData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    const token = await this.getAccessToken();
    
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );
  }

  async appendSheetData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    const token = await this.getAccessToken();
    
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    );
  }

  async updateSingleCell(spreadsheetId: string, cellRange: string, value: any): Promise<void> {
    const token = await this.getAccessToken();
    
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${cellRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[value]],
        }),
      }
    );
  }

  async findMemberByIdentifier(spreadsheetId: string, identifier: string, mapping: Record<string, string>): Promise<MemberInfo | null> {
    const range = 'A:Z'; // Get all data
    const data = await this.getSheetData(spreadsheetId, range);
    
    if (data.length === 0) return null;
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Find the row that matches the identifier
    for (const row of rows) {
      const memberData: any = {};
      
      // Map sheet columns to member fields
      headers.forEach((header, index) => {
        const memberField = mapping[header];
        if (memberField && row[index]) {
          memberData[memberField] = row[index];
        }
      });
      
      // Check if this row matches the identifier
      if (
        memberData.email === identifier ||
        memberData.phone === identifier ||
        memberData.whatsapp === identifier ||
        memberData.membership_number === identifier
      ) {
        return memberData as MemberInfo;
      }
    }
    
    return null;
  }

  async updateMemberPassword(spreadsheetId: string, membershipNumber: string, newPassword: string, mapping: Record<string, string>): Promise<void> {
    const range = 'A:Z';
    const data = await this.getSheetData(spreadsheetId, range);
    
    if (data.length === 0) return;
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Find password column
    const passwordColumnHeader = Object.keys(mapping).find(key => mapping[key] === 'password');
    const membershipColumnHeader = Object.keys(mapping).find(key => mapping[key] === 'membership_number');
    
    if (!passwordColumnHeader || !membershipColumnHeader) return;
    
    const passwordColumnIndex = headers.indexOf(passwordColumnHeader);
    const membershipColumnIndex = headers.indexOf(membershipColumnHeader);
    
    if (passwordColumnIndex === -1 || membershipColumnIndex === -1) return;
    
    // Find and update the member's password
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][membershipColumnIndex] === membershipNumber) {
        const updateRange = `${String.fromCharCode(65 + passwordColumnIndex)}${i + 2}`;
        await this.updateSingleCell(spreadsheetId, updateRange, newPassword);
        break;
      }
    }
  }

  // Gmail API
  async sendEmail(to: string, subject: string, body: string, isHtml: boolean = false): Promise<void> {
    const token = await this.getAccessToken();
    
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
      '',
      body
    ].join('\n');
    
    const encodedMessage = btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });
  }


}
