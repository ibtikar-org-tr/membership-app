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

export interface GoogleForm {
  id: string;
  google_form_id: string;
  created_at: string;
  updated_at: string;
  corresponding_values: Record<string, string>; // Dict<string, string>
}

export interface GoogleSheet {
  id: string;
  google_sheet_id: string;
  created_at: string;
  updated_at: string;
  corresponding_values: Record<string, string>; // Dict<string, string>
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
}
