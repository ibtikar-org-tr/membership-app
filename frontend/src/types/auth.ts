export interface AuthUser {
  membershipNumber: string
  email: string
  role: string
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

export interface ForgotPasswordResponse {
  success: boolean
  found: boolean
  message: string
  maskedEmail?: string
  telegramSent?: boolean
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
}
