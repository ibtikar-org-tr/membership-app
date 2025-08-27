import { MemberInfo } from '../models/types';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export class EmailService {
  constructor(private config: EmailConfig) {}

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    // Using worker-mailer to send emails
    const { sendMail } = await import('worker-mailer');
    
    try {
      await sendMail({
        to,
        subject,
        text,
        html: html || text,
        from: this.config.user,
        smtp: {
          host: this.config.host,
          port: this.config.port,
          username: this.config.user,
          password: this.config.pass,
        },
      });
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
            <h2>Welcome to Membership App!</h2>
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
                    <span class="label">Temporary Password:</span> ${temporaryPassword}
                </div>
            </div>
            
            <p><strong>Please log in to the system and change your password as soon as possible.</strong></p>
            <p>Your account has also been created in our Learning Management System (Moodle) with the same credentials.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Membership App Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await this.sendEmail(memberInfo.email, subject, text, html);
  }
}
