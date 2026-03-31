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
