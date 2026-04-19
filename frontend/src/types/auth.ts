export interface AuthUser {
  membershipNumber: string
  email: string
  role: string
}

export interface LoginResponse {
  user: AuthUser
}

export interface ForgotPasswordResponse {
  success: boolean
  found: boolean
  message: string
  maskedEmail?: string
  telegramSent?: boolean
}
