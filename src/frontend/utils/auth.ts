// Simple authentication state management using localStorage

export interface AuthState {
  isLoggedIn: boolean;
  userType: 'admin' | 'member' | null;
  memberInfo?: any;
}

const AUTH_KEY = 'membership_app_auth';

export function saveAuthState(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save auth state:', error);
  }
}

export function loadAuthState(): AuthState | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load auth state:', error);
  }
  return null;
}

export function clearAuthState(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.warn('Failed to clear auth state:', error);
  }
}

export function isAuthenticated(): boolean {
  const state = loadAuthState();
  return state?.isLoggedIn || false;
}

export function getUserType(): 'admin' | 'member' | null {
  const state = loadAuthState();
  return state?.userType || null;
}

export function getMemberInfo(): any {
  const state = loadAuthState();
  return state?.memberInfo || null;
}

/**
 * Masks an email address for privacy while keeping it recognizable
 * Example: john.doe@gmail.com -> joh****oe@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 3) {
    // For very short emails, show first and last character
    return `${localPart[0]}****${localPart[localPart.length - 1]}@${domain}`;
  }
  
  // For longer emails, show first 3 and last 2 characters
  const maskedLocal = `${localPart.slice(0, 3)}****${localPart.slice(-2)}`;
  return `${maskedLocal}@${domain}`;
}
