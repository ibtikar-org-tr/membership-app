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

  async sendPasswordResetEmail(to: string, resetToken: string, baseUrl: string, member: MemberInfo): Promise<void> {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const subject = 'طلب استرداد بيانات العضويّة - منصّة العضوية التابعة لتجمّع إبتكار';

    const text = `
مرحباً،

لقد طلبت استرداد البيانات الخاصة بك لمنصّة العضوية التابعة لتجمّع إبتكار.


إليك جميع المعلومات المسجلة في حسابك:

رقم العضوية: ${member.membership_number}
الاسم العربي: ${member.ar_name}
الاسم اللاتيني: ${member.latin_name}
واتساب: ${member.whatsapp}
الهاتف: ${member.phone}
البريد الإلكتروني: ${member.email}
الجنس: ${member.sex}
تاريخ الميلاد: ${member.birth_date}
البلد: ${member.country}
المدينة: ${member.city}
الحي: ${member.district}
الجامعة: ${member.university}
التخصص: ${member.major}
سنة التخرج: ${member.graduation_year}
فصيلة الدم: ${member.blood_type}
كلمة المرور الحالية: ${member.password}


في حال أردت تغيير كلمة السر كذلك يمكنك استخدام الرابط أدناه:

يرجى النقر على الرابط التالي لإعادة تعيين كلمة المرور:
${resetUrl}

هذا الرابط سينتهي صلاحيته خلال ساعة واحدة لأسباب أمنية.

إذا لم تطلب استرداد بيانات العضويّة، يرجى تجاهل هذا البريد الإلكتروني.

مع خالص التحية،
مكتب التحوّل الرّقمي - تجمّع إبتكار
    `.trim();

    const html = `
<!DOCTYPE html>
<html dir="rtl">
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
        .member-info { 
            background-color: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 5px; 
            padding: 15px; 
            margin: 20px 0; 
        }
        .info-row { margin: 8px 0; display: flex; justify-content: space-between; }
        .label { font-weight: bold; }
        .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>طلب استرداد بيانات العضويّة</h2>
        </div>
        <div class="content">
            <p>مرحباً،</p>
            <p>لقد طلبت استرداد البيانات الخاصة بك لمنصّة العضوية التابعة لتجمّع إبتكار.</p>
            
            <div class="member-info">
                <h3>معلومات حسابك:</h3>
                <div class="info-row">
                    <span class="label">رقم العضوية:</span> <span>${member.membership_number}</span>
                </div>
                <div class="info-row">
                    <span class="label">الاسم العربي:</span> <span>${member.ar_name}</span>
                </div>
                <div class="info-row">
                    <span class="label">الاسم اللاتيني:</span> <span>${member.latin_name}</span>
                </div>
                <div class="info-row">
                    <span class="label">واتساب:</span> <span>${member.whatsapp}</span>
                </div>
                <div class="info-row">
                    <span class="label">الهاتف:</span> <span>${member.phone}</span>
                </div>
                <div class="info-row">
                    <span class="label">البريد الإلكتروني:</span> <span>${member.email}</span>
                </div>
                <div class="info-row">
                    <span class="label">الجنس:</span> <span>${member.sex}</span>
                </div>
                <div class="info-row">
                    <span class="label">تاريخ الميلاد:</span> <span>${member.birth_date}</span>
                </div>
                <div class="info-row">
                    <span class="label">البلد:</span> <span>${member.country}</span>
                </div>
                <div class="info-row">
                    <span class="label">المدينة:</span> <span>${member.city}</span>
                </div>
                <div class="info-row">
                    <span class="label">الحي:</span> <span>${member.district}</span>
                </div>
                <div class="info-row">
                    <span class="label">الجامعة:</span> <span>${member.university}</span>
                </div>
                <div class="info-row">
                    <span class="label">التخصص:</span> <span>${member.major}</span>
                </div>
                <div class="info-row">
                    <span class="label">سنة التخرج:</span> <span>${member.graduation_year}</span>
                </div>
                <div class="info-row">
                    <span class="label">فصيلة الدم:</span> <span>${member.blood_type}</span>
                </div>
                <div class="info-row">
                <span class="label">كلمة المرور الحالية:</span> <span>${member.password}</span>
                </div>
            </div>

            <p>في حال أردت تغيير كلمة السر كذلك يمكنك استخدام الرابط أدناه:</p>
            <p>يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
            <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
            <p><strong>هذا الرابط سينتهي صلاحيته خلال ساعة واحدة لأسباب أمنية.</strong></p>
                
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
        </div>
        <div class="footer">
            <p>مع خالص التحية،<br>مكتب التحوّل الرّقمي - تجمّع إبتكار</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    await this.sendEmail(to, subject, text, html);
  }

  async sendWelcomeEmail(memberInfo: MemberInfo, temporaryPassword: string): Promise<void> {
    const subject = 'مرحباً بك في تجمّع إبتكار - تفاصيل العضويّة الخاصّة بك';
    
    const text = `
مرحباً ${memberInfo.ar_name}!

تم إنشاء حساب العضوية الخاص بك بنجاح. إليك تفاصيل حسابك:

رقم العضوية: ${memberInfo.membership_number}
الاسم: ${memberInfo.ar_name}
name: ${memberInfo.latin_name}
البريد الإلكتروني: ${memberInfo.email}
كلمة المرور: ${temporaryPassword}

يرجى حفظ المعلومات هذه حيث أنّك سوف تحتاجها كلما استخدمت خدماتنا.

تم إنشاء حسابك أيضاً في المنصّة التعليميّة الخاصّة بنا بنفس البيانات.

إذا كان لديك أي أسئلة، يرجى عدم التردد في الاتصال بنا.

مع خالص التحية،
مكتب التحوّل الرّقمي - تجمّع إبتكار
    `.trim();

    const html = `
<!DOCTYPE html>
<html dir="rtl">
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
            <h2>مرحباً بك في تجمّع إبتكار!</h2>
        </div>
        <div class="content">
            <p>عزيزي ${memberInfo.latin_name}،</p>
            <p>تم إنشاء حساب العضوية الخاص بك بنجاح. إليك تفاصيل حسابك:</p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="label">رقم العضوية:</span> ${memberInfo.membership_number}
                </div>
                <div class="info-row">
                    <span class="label">الاسم:</span> ${memberInfo.latin_name}
                </div>
                <div class="info-row">
                    <span class="label">البريد الإلكتروني:</span> ${memberInfo.email}
                </div>
                <div class="info-row">
                    <span class="label">كلمة المرور:</span> ${temporaryPassword}
                </div>
            </div>

            <p><strong>يرجى حفظ معلوماتك لأنك ستحتاجها في أي وقت تستخدم خدماتنا.</strong></p>
            <p>تم إنشاء حسابك أيضاً في المنصّة التعليميّة الخاصّة بنا بنفس البيانات.</p>
            <p>إذا كان لديك أي أسئلة، يرجى عدم التردد في الاتصال بنا.</p>
        </div>
        <div class="footer">
            <p>مع خالص التحية،<br>مكتب التحوّل الرّقمي - تجمّع إبتكار</p>
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
    const subject = 'محاولة تسجيل - الحساب موجود بالفعل';
    
    const text = `
عزيزي ${newMemberInfo.latin_name || 'العضو'}،

لقد تلقينا محاولة تسجيل جديدة بمعلوماتك، لكننا وجدنا أن لديك حساباً موجوداً لدينا بالفعل.

تفاصيل محاولة التسجيل:
- البريد الإلكتروني: ${newMemberInfo.email}
- الهاتف: ${newMemberInfo.phone || 'غير محدد'}
- الاسم: ${newMemberInfo.latin_name || 'غير محدد'}

تفاصيل حسابك الموجود:
- رقم العضوية: ${existingMemberInfo.membership_number}
- البريد الإلكتروني: ${existingMemberInfo.email}
- الهاتف: ${existingMemberInfo.phone}

إذا نسيت كلمة المرور، يمكنك إعادة تعيينها باستخدام ميزة "نسيت كلمة المرور" في صفحة تسجيل الدخول.

إذا كنت تعتقد أن هذا خطأ أو إذا كنت بحاجة إلى مساعدة، يرجى الاتصال بنا.

مع خالص التحية،
مكتب التحوّل الرّقمي - تجمّع إبتكار
    `.trim();

    const html = `
<!DOCTYPE html>
<html dir="rtl">
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
            <h2>محاولة تسجيل - الحساب موجود بالفعل</h2>
        </div>
        <div class="content">
            <p>عزيزي ${newMemberInfo.latin_name || 'العضو'}،</p>
            
            <div class="warning">
                <strong>⚠️ تم اكتشاف محاولة تسجيل</strong><br>
                لقد تلقينا محاولة تسجيل جديدة بمعلوماتك، لكننا وجدنا أن لديك حساباً موجوداً لدينا بالفعل.
            </div>

            <div class="registration-attempt">
                <h3>🚨 تفاصيل محاولة التسجيل:</h3>
                <ul>
                    <li><strong>البريد الإلكتروني:</strong> ${newMemberInfo.email}</li>
                    <li><strong>الهاتف:</strong> ${newMemberInfo.phone || 'غير محدد'}</li>
                    <li><strong>الاسم:</strong> ${newMemberInfo.latin_name || 'غير محدد'}</li>
                </ul>
            </div>
            
            <div class="account-details">
                <h3>📋 تفاصيل حسابك الموجود:</h3>
                <ul>
                    <li><strong>رقم العضوية:</strong> ${existingMemberInfo.membership_number}</li>
                    <li><strong>البريد الإلكتروني:</strong> ${existingMemberInfo.email}</li>
                    <li><strong>الهاتف:</strong> ${existingMemberInfo.phone || 'غير محدد'}</li>
                </ul>
            </div>
            
            <p><strong>تحتاج إلى الوصول إلى حسابك؟</strong></p>
            <ul>
                <li>إذا نسيت كلمة المرور، يمكنك إعادة تعيينها باستخدام ميزة "نسيت كلمة المرور" في صفحة تسجيل الدخول.</li>
                <li>اسم المستخدم الخاص بك هو عنوان بريدك الإلكتروني أو رقم العضوية.</li>
            </ul>
            
            <p>إذا كنت تعتقد أن هذا خطأ أو إذا كنت بحاجة إلى مساعدة، يرجى الاتصال بنا.</p>
        </div>
        <div class="footer">
            <p>مع خالص التحية،<br>فريق تطبيق العضوية</p>
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
