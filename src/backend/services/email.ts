import { MemberInfo } from '../models/types';
import { WorkerMailer } from 'worker-mailer';
export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export class EmailService {
  constructor(private config: EmailConfig) {}

  async sendEmail(to: string, subject: string, text: string, html?: string, cc?: string): Promise<void> {
    // Send email using worker-mailer
    try {
      const mailer = await WorkerMailer.connect({
        host: this.config.host,
        port: this.config.port,
        secure: false, // You may want to add 'secure' to EmailConfig if needed
        startTls: true, // or false depending on your config
        credentials: {
          username: this.config.user,
          password: this.config.pass,
        },
        authType: 'plain',
      });

      const emailOptions: any = {
        from: this.config.user,
        to,
        subject,
        text,
        html: html || text,
      };
      
      if (cc) {
        emailOptions.cc = cc;
      }
      
      await mailer.send(emailOptions);

      await mailer.close();
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string, baseUrl: string): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const subject = 'Password Reset Request - Membership App';
    
    const text = `
Hello,

You have requested to reset your password for the Membership App.

Please click on the following link to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
Membership App Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px 0; }
        .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
        }
        .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password for the Membership App.</p>
            <p>Please click on the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If you did not request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Membership App Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await this.sendEmail(to, subject, text, html);
  }

  async sendWelcomeEmail(memberInfo: MemberInfo, temporaryPassword: string): Promise<void> {
    const subject = 'Welcome to Membership App - Your Account Details';
    
    const text = `
Welcome ${memberInfo.latin_name}!

Your membership account has been successfully created. Here are your account details:

Membership Number: ${memberInfo.membership_number}
Name: ${memberInfo.latin_name}
Email: ${memberInfo.email}
Temporary Password: ${temporaryPassword}

Please log in to the system and change your password as soon as possible.

Your account has also been created in our Learning Management System (Moodle) with the same credentials.

If you have any questions, please don't hesitate to contact us.

Best regards,
Membership App Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px 0; }
        .info-box { 
            background-color: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 20px 0; 
        }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; }
        .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>welcome to ibtikar assembly!</h2>
        </div>
        <div class="content">
            <p>Dear ${memberInfo.latin_name},</p>
            <p>Your membership account has been successfully created. Here are your account details:</p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="label">Membership Number:</span> ${memberInfo.membership_number}
                </div>
                <div class="info-row">
                    <span class="label">Name:</span> ${memberInfo.latin_name}
                </div>
                <div class="info-row">
                    <span class="label">Email:</span> ${memberInfo.email}
                </div>
                <div class="info-row">
                    <span class="label">Password:</span> ${temporaryPassword}
                </div>
            </div>

            <p><strong>Please save your information because you will need it anytime you use our services.</strong></p>
            <p>Your account has also been created in our Learning Management System (Moodle LMS) with the same credentials.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>ibtikar assembly - technical team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await this.sendEmail(memberInfo.email, subject, text, html);
  }

  async sendDuplicateNotificationEmail(
    newMemberInfo: MemberInfo, 
    existingMemberInfo: MemberInfo, 
    matchType: 'email' | 'phone' = 'email'
  ): Promise<void> {
    const subject = 'Registration Attempt - Account Already Exists';
    
    const text = `
Dear ${newMemberInfo.latin_name || 'Member'},

We received a new registration attempt with your information, but we found that you already have an account with us.

Registration Attempt Details:
- Email: ${newMemberInfo.email}
- Phone: ${newMemberInfo.phone || 'N/A'}
- Name: ${newMemberInfo.latin_name || 'N/A'}

Your existing account details:
- Membership Number: ${existingMemberInfo.membership_number}
- Email: ${existingMemberInfo.email}
- Phone: ${existingMemberInfo.phone}

If you forgot your password, you can reset it using the "Forgot Password" feature on our login page.

If you believe this is an error or if you need assistance, please contact us.

Best regards,
Membership App Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .account-details { background-color: #e9f4ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .registration-attempt { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
        .warning { color: #856404; background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Registration Attempt - Account Already Exists</h2>
        </div>
        <div class="content">
            <p>Dear ${newMemberInfo.latin_name || 'Member'},</p>
            
            <div class="warning">
                <strong>⚠️ Registration Attempt Detected</strong><br>
                We received a new registration attempt with your information, but we found that you already have an account with us.
            </div>

            <div class="registration-attempt">
                <h3>🚨 Registration Attempt Details:</h3>
                <ul>
                    <li><strong>Email:</strong> ${newMemberInfo.email}</li>
                    <li><strong>Phone:</strong> ${newMemberInfo.phone || 'N/A'}</li>
                    <li><strong>Name:</strong> ${newMemberInfo.latin_name || 'N/A'}</li>
                </ul>
            </div>
            
            <div class="account-details">
                <h3>📋 Your Existing Account Details:</h3>
                <ul>
                    <li><strong>Membership Number:</strong> ${existingMemberInfo.membership_number}</li>
                    <li><strong>Email:</strong> ${existingMemberInfo.email}</li>
                    <li><strong>Phone:</strong> ${existingMemberInfo.phone || 'N/A'}</li>
                </ul>
            </div>
            
            <p><strong>Need to access your account?</strong></p>
            <ul>
                <li>If you forgot your password, you can reset it using the "Forgot Password" feature on our login page.</li>
                <li>Your username is your email address or membership number.</li>
            </ul>
            
            <p>If you believe this is an error or if you need assistance, please contact us.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Membership App Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    // Determine if we need to CC the original email
    const ccEmail = matchType === 'phone' && existingMemberInfo.email !== newMemberInfo.email 
      ? existingMemberInfo.email 
      : undefined;
    
    await this.sendEmail(newMemberInfo.email, subject, text, html, ccEmail);
  }
}
