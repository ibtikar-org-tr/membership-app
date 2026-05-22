interface RegistrationCredentialsEmailContent {
  membershipNumber: string
  temporaryPassword: string
  loginUrl: string
  telegramBotUrl: string
  telegramGuideUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function credentialRow(label: string, value: string, hint: string): string {
  const safeValue = escapeHtml(value)

  return `
    <tr>
      <td style="padding: 0 0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; overflow: hidden;">
          <tr>
            <td style="padding: 12px 16px 6px; font-size: 13px; font-weight: 700; color: #475569; font-family: Tahoma, Arial, sans-serif;">
              ${label}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 16px 8px;">
              <div
                style="
                  display: block;
                  padding: 14px 16px;
                  background-color: #ffffff;
                  border: 1px dashed #cbd5e1;
                  border-radius: 10px;
                  font-size: 20px;
                  font-weight: 700;
                  letter-spacing: 0.04em;
                  color: #0f172a;
                  font-family: 'Courier New', Courier, monospace;
                  line-height: 1.4;
                  text-align: center;
                  direction: ltr;
                  -webkit-user-select: all;
                  user-select: all;
                  word-break: break-all;
                "
                title="${hint}"
              >${safeValue}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 16px 12px; font-size: 12px; color: #64748b; font-family: Tahoma, Arial, sans-serif; text-align: center;">
              ${hint}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `.trim()
}

export function buildRegistrationCredentialsEmailText(content: RegistrationCredentialsEmailContent): string {
  return [
    'مرحباً بك في تجمّع إبتكار',
    '',
    'تم إنشاء حساب عضويتك بنجاح. احفظ البيانات التالية في مكان آمن:',
    '',
    `رقم العضوية: ${content.membershipNumber}`,
    `كلمة المرور المؤقتة: ${content.temporaryPassword}`,
    '',
    'خطوات مهمة:',
    '1) سجّل الدخول وغيّر كلمة المرور فوراً.',
    `   ${content.loginUrl}`,
    '2) فعّل بوت تيليغرام (مطلوب لتسجيل الدخول لاحقاً).',
    `   ${content.telegramBotUrl}`,
    `   دليل التفعيل: ${content.telegramGuideUrl}`,
    '',
    'مع خالص التحية،',
    'مكتب التحوّل الرّقمي — تجمّع إبتكار',
  ].join('\n')
}

export function buildRegistrationCredentialsEmailHtml(content: RegistrationCredentialsEmailContent): string {
  const membershipNumber = escapeHtml(content.membershipNumber)
  const loginUrl = escapeHtml(content.loginUrl)
  const telegramBotUrl = escapeHtml(content.telegramBotUrl)
  const telegramGuideUrl = escapeHtml(content.telegramGuideUrl)
  const selectToCopyHint = 'حدّد النص للنسخ (اضغط مطولاً على الجوال)'

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>بيانات حساب العضوية</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ecfeff; font-family: Tahoma, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #ecfeff 0%, #f8fafc 45%, #fffbeb 100%); padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08); overflow: hidden;">
          <tr>
            <td style="padding: 28px 28px 20px; text-align: center; background: linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #0369a1 100%);">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #cffafe; letter-spacing: 0.06em;">تجمّع إبتكار</p>
              <h1 style="margin: 0; font-size: 26px; line-height: 1.35; font-weight: 800; color: #ffffff;">مرحباً بك في التجمّع</h1>
              <p style="margin: 12px 0 0; font-size: 14px; line-height: 1.7; color: #e0f2fe;">تم إنشاء حسابك بنجاح. احفظ بيانات الدخول أدناه.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 24px 8px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.8; color: #334155;">
                هذه كلمة مرور <strong>مؤقتة</strong>. بعد تسجيل الدخول غيّرها فوراً، ثم فعّل بوت تيليغرام لإكمال العضوية.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${credentialRow('رقم العضوية', content.membershipNumber, selectToCopyHint)}
                ${credentialRow('كلمة المرور المؤقتة', content.temporaryPassword, selectToCopyHint)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; line-height: 1.7; color: #92400e;">
                    <strong>تنبيه أمني:</strong> لا تشارك كلمة المرور مع أي شخص. غيّرها مباشرة بعد أول تسجيل دخول.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #0f172a;">الخطوات التالية</p>
              <a
                href="${loginUrl}"
                style="display: inline-block; margin: 0 0 10px; padding: 14px 28px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700;"
              >تسجيل الدخول إلى المنصة</a>
              <br />
              <a
                href="${telegramBotUrl}"
                style="display: inline-block; margin: 6px 0; padding: 12px 22px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 700;"
              >فتح بوت تيليغرام</a>
              <br />
              <a
                href="${telegramGuideUrl}"
                style="display: inline-block; margin: 6px 0 0; color: #0369a1; font-size: 13px; font-weight: 700; text-decoration: underline;"
              >دليل تفعيل البوت خطوة بخطوة</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 24px 24px; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 1.7; color: #64748b; text-align: center;">
              مع خالص التحية،<br />
              <strong style="color: #334155;">مكتب التحوّل الرّقمي — تجمّع إبتكار</strong>
              <br /><br />
              <span style="font-size: 11px; color: #94a3b8;">رقم العضوية: ${membershipNumber}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function resolveRegistrationEmailUrls(frontendBaseUrl: string | undefined) {
  const base = (frontendBaseUrl?.trim() || 'https://ibtikar.tr').replace(/\/+$/, '')

  return {
    loginUrl: `${base}/login`,
    telegramBotUrl: 'https://t.me/ibtikar_bot',
    telegramGuideUrl: `${base}/telegram-bot`,
  }
}
