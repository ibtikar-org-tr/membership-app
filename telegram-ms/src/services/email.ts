import { Environment } from '../types';
import { WorkerMailer } from 'worker-mailer';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(env: Environment) {
    this.config = {
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    };
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    try {
      const mailer = await WorkerMailer.connect({
        host: this.config.host,
        port: this.config.port,
        secure: false,
        startTls: true,
        credentials: {
          username: this.config.user,
          password: this.config.pass,
        },
        authType: 'plain',
      });

      const emailOptions = {
        from: this.config.user,
        to,
        subject,
        text,
        html: html || text,
      };
      
      await mailer.send(emailOptions);
      await mailer.close();
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, verificationLink: string, verificationCode?: string): Promise<void> {
    const subject = 'Telegram Bot Verification - تجمّع إبتكار';

    const codeSection = verificationCode ? `
رمز التحقق الخاص بك: ${verificationCode}

يمكنك إدخال هذا الرمز في التليجرام، أو استخدام الرابط أدناه.
` : '';

    const text = `
مرحباً،

${codeSection}
يرجى النقر على الرابط أدناه للتحقق من حساب التليجرام الخاص بك:

${verificationLink}

سيؤدي هذا الرابط إلى تسجيل حساب التليجرام الخاص بك تلقائياً في نظامنا.

مع خالص التحية،
فريق تجمّع إبتكار
    `.trim();

    const codeHtml = verificationCode ? `
            <div style="text-align: center; background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">رمز التحقق الخاص بك:</p>
                <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 0;">${verificationCode}</p>
            </div>
            <p style="text-align: center; color: #666; font-size: 14px;">يمكنك إدخال هذا الرمز في التليجرام</p>
            <p style="text-align: center; margin: 20px 0;"><strong>أو</strong></p>
` : '';

    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
        .content { padding: 20px 0; }
        .button { 
            display: inline-block; 
            background-color: #28a745; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-weight: bold;
        }
        .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>التحقق من حساب التليجرام</h2>
        </div>
        <div class="content">
            <p>مرحباً،</p>
            ${codeHtml}
            <p>يرجى النقر على الزر أدناه للتحقق من حساب التليجرام الخاص بك:</p>
            <p style="text-align: center;">
                <a href="${verificationLink}" class="button">تحقق من الحساب</a>
            </p>
            <p>سيؤدي هذا الرابط إلى تسجيل حساب التليجرام الخاص بك تلقائياً في نظامنا.</p>
            <p>إذا لم تطلب هذا التحقق، يرجى تجاهل هذا البريد الإلكتروني.</p>
        </div>
        <div class="footer">
            <p>مع خالص التحية،<br>فريق تجمّع إبتكار</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await this.sendEmail(email, subject, text, html);
  }
}