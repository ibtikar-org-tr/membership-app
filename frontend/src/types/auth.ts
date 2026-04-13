export interface AuthUser {
  membershipNumber: string
  email: string
  role: string
}

export interface LoginResponse {
  user: AuthUser
}
