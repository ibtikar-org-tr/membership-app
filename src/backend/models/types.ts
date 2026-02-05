// Database Models
export interface PasswordResetRequest {
  id: string;
  membership_number: string;
  email: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "completed" | "failed";
  token: string;
}

export interface User {
  id: string;
  membership_number: string;
  email: string;
  password_hash: string;
  role: 'member' | 'admin';
  status: 'pending' | 'active' | 'disabled';
  latin_name?: string;
  phone?: string;
  whatsapp?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingSignup {
  id: string;
  email: string;
  requested_membership_number?: string | null;
  data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  approval_token: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
}

export interface OAuthClient {
  id: string;
  client_id: string;
  client_secret_hash: string;
  name: string;
  allowed_ips?: string | null; // JSON array string
  created_at: string;
  updated_at: string;
}

export interface OAuthToken {
  id: string;
  client_id: string;
  user_id?: string | null;
  created_at: string;
  expires_at: string;
}

export interface SheetSyncState {
  id: string;
  last_sync_at?: string | null;
  last_checkpoint?: string | null;
}

export interface GoogleFormSheet {
  id: string;
  google_form_sheet_id: string; // Now stores the Google Sheet ID that contains form responses
  created_at: string;
  updated_at: string;
  corresponding_values: Record<string, string>; // Maps form sheet columns to member fields
  auto_note_column?: string; // Column letter (e.g., 'Z') for tracking processed responses
}

export interface GoogleSheet {
  id: string;
  google_sheet_id: string; // Member database sheet where processed members are stored
  created_at: string;
  updated_at: string;
  corresponding_values: Record<string, string>; // Maps member sheet columns to member fields
}

export interface Log {
  id: string;
  user: string; // membership_number or "admin"
  action: string;
  status: string;
  created_at: string;
}

// Schema Models
export interface MemberInfo {
  membership_number: string;
  ar_name: string;
  latin_name: string;
  whatsapp: string;
  email: string;
  sex: string;
  birth_date: string;
  country: string;
  city: string;
  district: string;
  university: string;
  major: string;
  graduation_year: string;
  blood_type: string;
  password: string;
  phone: string;
}

// API Request/Response Types
export interface LoginRequest {
  field1: string; // email, membership_number, or "admin"
  password: string;
}

export interface ForgotPasswordRequest {
  type: "email" | "phone" | "membership_number";
  value: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface UpdateMemberRequest {
  membership_number: string;
  updates: Partial<MemberInfo>;
}

// Environment Bindings
export interface CloudflareBindings {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  GOOGLE_API_KEY: string;
  MOODLE_API_URL: string;
  MOODLE_API_TOKEN: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  JWT_SECRET: string;
  MEMBERSHIP_NUMBER_PREFIX: string;
  ADMIN_EMAIL: string;
  OAUTH_JWT_SECRET: string;
}
