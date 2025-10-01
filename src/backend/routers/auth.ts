import { Hono } from 'hono';
import { AuthService } from '../services/auth';
import { GoogleAPIService } from '../services/google-api';
import { MoodleAPIService } from '../services/moodle-api';
import { EmailService } from '../services/email';
import { Database } from '../models/database';
import { CloudflareBindings, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../models/types';

const authRouter = new Hono<{ Bindings: CloudflareBindings }>();

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

    if (field1 === 'admin') {
      // Admin login
      const isValid = await authService.authenticateAdmin(password, c.env.ADMIN_PASSWORD);
      
      await db.createLog({
        user: 'admin',
        action: 'admin_login',
        status: isValid ? 'success' : 'failed'
      });

      if (isValid) {
        return c.json({ success: true, userType: 'admin' });
      } else {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
    } else {
      // Member login
      const member = await authService.authenticateMember(field1, password);
      
      await db.createLog({
        user: member ? member.membership_number : field1,
        action: 'member_login',
        status: member ? 'success' : 'failed'
      });

      if (member) {
        return c.json({ 
          success: true, 
          userType: 'member', 
          memberInfo: member 
        });
      } else {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
    }
  } catch (error) {
    console.error('Login error:', error);
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
      
      return c.json({ success: true, message: 'If the provided information is valid, a reset link will be sent to your email.' });
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

    return c.json({ 
      success: true, 
      message: 'If the provided information is valid, a reset link will be sent to your email.' 
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
      error: error.message,
      stack: error.stack
    });
  }
});

export { authRouter };
