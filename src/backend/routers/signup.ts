import { Hono } from 'hono';
import { Database } from '../models/database';
import { CloudflareBindings } from '../models/types';
import { EmailService } from '../services/email';
import bcrypt from 'bcryptjs';

const signupRouter = new Hono<{ Bindings: CloudflareBindings }>();

interface SignupRequest {
  email: string;
  requested_membership_number?: string;
  ar_name: string;
  latin_name: string;
  whatsapp: string;
  phone: string;
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
}

/**
 * Public Signup Endpoint
 * Allows users to request membership via API
 * Requires admin approval before activation
 */
signupRouter.post('/request', async (c) => {
  try {
    const signupData = await c.req.json<SignupRequest>();

    // Validate required fields
    const requiredFields = [
      'email',
      'ar_name',
      'latin_name',
      'whatsapp',
      'phone',
      'password',
    ];

    for (const field of requiredFields) {
      if (!signupData[field as keyof SignupRequest]) {
        return c.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          400
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      return c.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        400
      );
    }

    const db = new Database(c.env.DB);

    // Check if email already exists
    const existingUser = await db.getUserByEmail(signupData.email);
    if (existingUser) {
      await db.createLog({
        user: signupData.email,
        action: 'signup_request',
        status: 'failed_duplicate_email',
      });

      return c.json(
        {
          success: false,
          error: 'Email already registered',
        },
        400
      );
    }

    // Generate approval token
    const approvalToken = crypto.randomUUID();

    // Hash password before storing
    const passwordHash = await bcrypt.hash(signupData.password, 12);

    // Store signup data with hashed password
    const signupDataWithHash = {
      ...signupData,
      password: passwordHash, // Store hashed password
    };

    // Create pending signup
    const pendingSignup = await db.createPendingSignup({
      email: signupData.email,
      requested_membership_number: signupData.requested_membership_number || null,
      data: signupDataWithHash,
      approval_token: approvalToken,
    });

    await db.createLog({
      user: signupData.email,
      action: 'signup_request',
      status: 'pending',
    });

    // Send notification email to admin (optional)
    try {
      const emailService = new EmailService({
        host: c.env.SMTP_HOST,
        port: parseInt(c.env.SMTP_PORT),
        user: c.env.SMTP_USER,
        pass: c.env.SMTP_PASS,
      });

      await emailService.sendEmail(
        c.env.ADMIN_EMAIL,
        'New Membership Signup Request',
        `
A new member has requested to sign up:

Name: ${signupData.ar_name} / ${signupData.latin_name}
Email: ${signupData.email}
Phone: ${signupData.phone}
WhatsApp: ${signupData.whatsapp}
Requested Membership Number: ${signupData.requested_membership_number || 'Auto-assign'}

Please review and approve/reject this request in the admin panel.
        `.trim()
      );
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Don't fail the signup if email fails
    }

    return c.json({
      success: true,
      message: 'Signup request submitted successfully. Please wait for admin approval.',
      request_id: pendingSignup.id,
    });
  } catch (error) {
    console.error('Signup request error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
});

/**
 * Check Signup Status Endpoint
 * Allows users to check the status of their signup request
 */
signupRouter.get('/status/:email', async (c) => {
  try {
    const email = c.req.param('email');

    if (!email) {
      return c.json(
        {
          success: false,
          error: 'Email is required',
        },
        400
      );
    }

    const db = new Database(c.env.DB);

    // Check if user is already approved (exists in users table)
    const user = await db.getUserByEmail(email);
    if (user) {
      return c.json({
        success: true,
        status: 'approved',
        message: 'Your account has been approved. You can now log in.',
      });
    }

    // Check pending signups
    const pendingSignups = await db.getPendingSignups();
    const pendingSignup = pendingSignups.find((s) => s.email === email);

    if (!pendingSignup) {
      return c.json({
        success: true,
        status: 'not_found',
        message: 'No signup request found for this email.',
      });
    }

    return c.json({
      success: true,
      status: pendingSignup.status,
      message:
        pendingSignup.status === 'pending'
          ? 'Your request is pending admin approval.'
          : pendingSignup.status === 'rejected'
          ? 'Your request has been rejected.'
          : 'Your request status is: ' + pendingSignup.status,
    });
  } catch (error) {
    console.error('Signup status check error:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
});

export { signupRouter };
