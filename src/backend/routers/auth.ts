import { Hono } from 'hono';
import { AuthService } from '../services/auth';
import { GoogleAPIService } from '../services/google-api';
import { MoodleAPIService } from '../services/moodle-api';
import { EmailService } from '../services/email';
import { Database } from '../models/database';
import { CloudflareBindings, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, User } from '../models/types';
import bcrypt from 'bcryptjs';

const authRouter = new Hono<{ Bindings: CloudflareBindings }>();

// Session configuration
const SESSION_COOKIE_NAME = 'session_id';
const SESSION_IDLE_MINUTES = 30; // idle timeout
const SESSION_ABSOLUTE_DAYS = 7; // absolute max age

function buildSessionCookie(id: string, expiresAt: Date): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${id}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  return parts.join('; ');
}

function clearSessionCookie(): string {
  const past = new Date(0);
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${past.toUTCString()}`;
}

async function getClientIp(c: any): Promise<string | undefined> {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || undefined;
}

async function ensureAdminUser(db: Database, adminEmail: string, adminPassword: string): Promise<User> {
  // Try to find existing admin user by membership_number 'admin'
  let user = await db.getUserByMembershipNumber('admin');
  if (user) {
    return user;
  }

  const password_hash = await bcrypt.hash(adminPassword, 12);
  return db.createUser({
    membership_number: 'admin',
    email: adminEmail,
    password_hash,
    role: 'admin',
    status: 'active',
    latin_name: 'Administrator',
    phone: undefined,
    whatsapp: undefined,
  });
}

authRouter.post('/login', async (c) => {
  try {
    const { field1, password } = await c.req.json<LoginRequest>();
    
    const db = new Database(c.env.DB);
    
    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    
    const authService = new AuthService(db, googleService, c.env.JWT_SECRET);
    
    // Log the login attempt
    await db.createLog({
      user: field1,
      action: 'login_attempt',
      status: 'pending'
    });

    // Admin login path
    if (field1 === 'admin') {
      const isValid = await authService.authenticateAdmin(password, c.env.ADMIN_PASSWORD);
      
      await db.createLog({
        user: 'admin',
        action: 'admin_login',
        status: isValid ? 'success' : 'failed'
      });

      if (!isValid) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }

      const adminUser = await ensureAdminUser(db, c.env.ADMIN_EMAIL, c.env.ADMIN_PASSWORD);

      // Create session for admin
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const absoluteExpiry = new Date(now.getTime() + SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000);
      const idleExpiry = new Date(now.getTime() + SESSION_IDLE_MINUTES * 60 * 1000);
      const expiresAt = idleExpiry < absoluteExpiry ? idleExpiry : absoluteExpiry;

      await db.createSession({
        id: sessionId,
        user_id: adminUser.id,
        ip: await getClientIp(c),
        user_agent: c.req.header('User-Agent') || undefined,
        expires_at: expiresAt.toISOString(),
      });

      c.header('Set-Cookie', buildSessionCookie(sessionId, expiresAt));

      return c.json({ success: true, userType: 'admin' });
    }

    // Member login
    const result = await authService.authenticateMember(field1, password);

    await db.createLog({
      user: result ? result.user.membership_number : field1,
      action: 'member_login',
      status: result ? 'success' : 'failed'
    });

    if (!result) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    const { user, member } = result;

    // Create member session
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const absoluteExpiry = new Date(now.getTime() + SESSION_ABSOLUTE_DAYS * 24 * 60 * 60 * 1000);
    const idleExpiry = new Date(now.getTime() + SESSION_IDLE_MINUTES * 60 * 1000);
    const expiresAt = idleExpiry < absoluteExpiry ? idleExpiry : absoluteExpiry;

    await db.createSession({
      id: sessionId,
      user_id: user.id,
      ip: await getClientIp(c),
      user_agent: c.req.header('User-Agent') || undefined,
      expires_at: expiresAt.toISOString(),
    });

    c.header('Set-Cookie', buildSessionCookie(sessionId, expiresAt));

    return c.json({ 
      success: true, 
      userType: user.role === 'admin' ? 'admin' : 'member', 
      memberInfo: member 
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Logout - clear session and cookie
authRouter.post('/logout', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const cookies = c.req.header('Cookie') || '';
    const sessionCookie = cookies.split(';').find((p) => p.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
    if (sessionCookie) {
      const sessionId = sessionCookie.split('=')[1];
      if (sessionId) {
        await db.deleteSession(sessionId);
      }
    }

    c.header('Set-Cookie', clearSessionCookie());
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Current authenticated user info based on session
authRouter.get('/me', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const cookies = c.req.header('Cookie') || '';
    const sessionCookie = cookies.split(';').find((p) => p.trim().startsWith(`${SESSION_COOKIE_NAME}=`));
    if (!sessionCookie) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const sessionId = sessionCookie.split('=')[1];
    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const nowIso = new Date().toISOString();
    if (session.expires_at <= nowIso) {
      await db.deleteSession(session.id);
      return c.json({ success: false, error: 'Session expired' }, 401);
    }

    const user = await db.getUserById(session.user_id);
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Touch session idle timeout
    const now = new Date();
    const newIdleExpiry = new Date(now.getTime() + SESSION_IDLE_MINUTES * 60 * 1000);
    const absExpiry = new Date(session.expires_at);
    const newExpires = newIdleExpiry < absExpiry ? newIdleExpiry : absExpiry;

    await db.touchSession(session.id, now.toISOString(), newExpires.toISOString());
    c.header('Set-Cookie', buildSessionCookie(session.id, newExpires));

    // For now, return minimal user info; frontend can still use memberInfo from login if needed
    return c.json({
      success: true,
      user: {
        id: user.id,
        membership_number: user.membership_number,
        email: user.email,
        role: user.role,
        status: user.status,
        latin_name: user.latin_name,
        phone: user.phone,
        whatsapp: user.whatsapp,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

authRouter.post('/forgot-password', async (c) => {
  try {
    const { type, value } = await c.req.json<ForgotPasswordRequest>();
    
    const db = new Database(c.env.DB);
    
    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    
    const authService = new AuthService(db, googleService, c.env.JWT_SECRET);
    
    // Log the password reset request
    await db.createLog({
      user: value,
      action: 'password_reset_request',
      status: 'pending'
    });

    // Get Google Sheet configuration
    const sheetConfig = await db.getGoogleSheet();
    if (!sheetConfig) {
      return c.json({ success: false, error: 'System configuration error' }, 500);
    }

    // Find member by identifier
    const member = await googleService.findMemberByIdentifier(
      sheetConfig.google_sheet_id,
      value,
      sheetConfig.corresponding_values
    );

    if (!member) {
      // Log failed attempt but don't reveal if user exists
      await db.createLog({
        user: value,
        action: 'password_reset_request',
        status: 'failed_user_not_found'
      });
      
      return c.json({ success: true, found: false, message: 'If the provided information is valid, a reset link will be sent to your email.' });
    }

    // Generate reset token
    const token = await authService.generatePasswordResetToken(member.membership_number, member.email);
    
    // Save reset request to database
    await db.createPasswordResetRequest({
      membership_number: member.membership_number,
      email: member.email,
      status: 'pending',
      token
    });

    // Send reset email
    const emailService = new EmailService({
      host: c.env.SMTP_HOST,
      port: parseInt(c.env.SMTP_PORT),
      user: c.env.SMTP_USER,
      pass: c.env.SMTP_PASS
    });

    const baseUrl = new URL(c.req.url).origin;
    await emailService.sendPasswordResetEmail(member.email, token, baseUrl, member);

    await db.createLog({
      user: member.membership_number,
      action: 'password_reset_request',
      status: 'success'
    });

    // Helper function to mask email for privacy
    const maskEmail = (email: string): string => {
      if (!email || !email.includes('@')) {
        return email;
      }
      const [localPart, domain] = email.split('@');
      if (localPart.length <= 3) {
        return `${localPart[0]}****${localPart[localPart.length - 1]}@${domain}`;
      }
      const maskedLocal = `${localPart.slice(0, 3)}****${localPart.slice(-2)}`;
      return `${maskedLocal}@${domain}`;
    };

    return c.json({ 
      success: true, 
      found: true,
      message: 'If the provided information is valid, a reset link will be sent to your email.',
      maskedEmail: maskEmail(member.email)
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

authRouter.post('/reset-password', async (c) => {
  try {
    const { token, new_password } = await c.req.json<ResetPasswordRequest>();
    
    if (!token || !new_password) {
      return c.json({ success: false, error: 'Token and new password are required' }, 400);
    }
    
    const db = new Database(c.env.DB);
    
    // Create Google API service
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    
    const authService = new AuthService(db, googleService, c.env.JWT_SECRET);
    
    // Verify token
    console.log('Verifying token for password reset...');
    const payload = await authService.verifyPasswordResetToken(token);
    if (!payload) {
      console.log('Token verification failed');
      await db.createLog({
        user: 'unknown',
        action: 'password_reset_failed',
        status: 'invalid_token'
      });
      return c.json({ success: false, error: 'Invalid or expired token' }, 400);
    }
    console.log('Token verified successfully for user:', payload.membership_number);

    // Check if reset request exists and is pending
    const resetRequest = await db.getPasswordResetRequestByToken(token);
    if (!resetRequest || resetRequest.status !== 'pending') {
      return c.json({ success: false, error: 'Invalid or already used token' }, 400);
    }

    // Update password in Google Sheets
    await authService.updateMemberPassword(payload.membership_number, new_password);
    
    // Update password in Moodle
    const moodleService = new MoodleAPIService(c.env.MOODLE_API_URL, c.env.MOODLE_API_TOKEN);
    const moodleUser = await moodleService.getUserByUsername(payload.membership_number);
    if (moodleUser) {
      await moodleService.updateUserPassword(moodleUser.id!, new_password);
    }

    // Mark reset request as completed
    await db.updatePasswordResetRequestStatus(resetRequest.id, 'completed');

    await db.createLog({
      user: payload.membership_number,
      action: 'password_reset_completed',
      status: 'success'
    });

    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset Information error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Test JWT endpoint for debugging
authRouter.post('/test-jwt', async (c) => {
  try {
    const db = new Database(c.env.DB);
    const googleCredentials = typeof c.env.GOOGLE_API_KEY === 'string' 
      ? JSON.parse(c.env.GOOGLE_API_KEY) 
      : c.env.GOOGLE_API_KEY;
    const googleService = new GoogleAPIService(googleCredentials);
    const authService = new AuthService(db, googleService, c.env.JWT_SECRET);
    
    // Create a test token
    const testToken = await authService.generatePasswordResetToken('TEST123', 'test@example.com');
    
    // Immediately verify it
    const verified = await authService.verifyPasswordResetToken(testToken);
    
    return c.json({
      success: true,
      testToken,
      verified,
      currentTime: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

export { authRouter };
