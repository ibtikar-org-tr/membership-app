import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { WorkerMailer } from 'worker-mailer'
import { getUserByEmail, getUserByMembershipNumber, updateUserPasswordHash } from '../repositories/users.repository'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  loginSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema'
import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'
import { hashPassword, verifyPassword } from '../utils/password'

export const authRoute = new Hono<{ Bindings: AppBindings }>()

interface ForgotMemberRow {
  membership_number: string
  email: string
  en_name: string | null
  ar_name: string | null
  phone_number: string | null
  telegram_id: string | null
}

interface PasswordResetTokenPayload {
  membershipNumber: string
  email: string
  exp: number
}

const PASSWORD_RESET_TTL_SECONDS = 60 * 60

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(normalized + padding)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }

  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index]
  }

  return diff === 0
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return bytesToBase64Url(new Uint8Array(signature))
}

async function createPasswordResetToken(bindings: AppBindings, member: ForgotMemberRow): Promise<string> {
  const secret = bindings.INTERNAL_SECRET?.trim()
  if (!secret) {
    throw new Error('INTERNAL_SECRET is not configured.')
  }

  const payload: PasswordResetTokenPayload = {
    membershipNumber: member.membership_number,
    email: member.email,
    exp: Math.floor(Date.now() / 1000) + PASSWORD_RESET_TTL_SECONDS,
  }

  const payloadEncoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await signPayload(secret, payloadEncoded)
  return `${payloadEncoded}.${signature}`
}

async function verifyPasswordResetToken(bindings: AppBindings, token: string): Promise<PasswordResetTokenPayload | null> {
  const secret = bindings.INTERNAL_SECRET?.trim()
  if (!secret) {
    throw new Error('INTERNAL_SECRET is not configured.')
  }

  const [payloadPart, signaturePart] = token.split('.')
  if (!payloadPart || !signaturePart) {
    return null
  }

  const expectedSignature = await signPayload(secret, payloadPart)
  const expectedBytes = base64UrlToBytes(expectedSignature)
  const receivedBytes = base64UrlToBytes(signaturePart)

  if (!safeEqual(expectedBytes, receivedBytes)) {
    return null
  }

  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)))
  } catch {
    return null
  }

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const membershipNumber = 'membershipNumber' in payload ? payload.membershipNumber : undefined
  const email = 'email' in payload ? payload.email : undefined
  const exp = 'exp' in payload ? payload.exp : undefined

  if (
    typeof membershipNumber !== 'string' ||
    typeof email !== 'string' ||
    typeof exp !== 'number' ||
    !Number.isFinite(exp)
  ) {
    return null
  }

  if (exp <= Math.floor(Date.now() / 1000)) {
    return null
  }

  return { membershipNumber, email, exp }
}

function maskEmail(email: string): string {
  if (!email.includes('@')) {
    return email
  }

  const [localPart, domain] = email.split('@')
  if (localPart.length <= 3) {
    return `${localPart[0] ?? ''}****${localPart[localPart.length - 1] ?? ''}@${domain}`
  }

  return `${localPart.slice(0, 3)}****${localPart.slice(-2)}@${domain}`
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

async function findMemberByRecoveryInput(
  bindings: AppBindings,
  payload: ForgotPasswordInput,
): Promise<ForgotMemberRow | null> {
  const normalizedValue = payload.value.trim()

  if (payload.type === 'email') {
    return bindings.MEMBERS_DB
      .prepare(
        `SELECT
          u.membership_number,
          u.email,
          ui.en_name,
          ui.ar_name,
          ui.phone_number,
          ui.telegram_id
        FROM users u
        LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
        WHERE LOWER(u.email) = LOWER(?)
        LIMIT 1`,
      )
      .bind(normalizedValue)
      .first<ForgotMemberRow>()
  }

  if (payload.type === 'membership_number') {
    return bindings.MEMBERS_DB
      .prepare(
        `SELECT
          u.membership_number,
          u.email,
          ui.en_name,
          ui.ar_name,
          ui.phone_number,
          ui.telegram_id
        FROM users u
        LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
        WHERE u.membership_number = ?
        LIMIT 1`,
      )
      .bind(normalizedValue)
      .first<ForgotMemberRow>()
  }

  const normalizedPhone = normalizePhone(normalizedValue)

  return bindings.MEMBERS_DB
    .prepare(
      `SELECT
        u.membership_number,
        u.email,
        ui.en_name,
        ui.ar_name,
        ui.phone_number,
        ui.telegram_id
      FROM users u
      LEFT JOIN user_info ui ON ui.membership_number = u.membership_number
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(ui.phone_number, ''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') = ?
      LIMIT 1`,
    )
    .bind(normalizedPhone)
    .first<ForgotMemberRow>()
}

async function sendRecoveryEmail(
  bindings: AppBindings,
  member: ForgotMemberRow,
  resetUrl: string,
): Promise<void> {
  const smtpPort = Number.parseInt(String(bindings.SMTP_PORT ?? '587'), 10)
  if (!bindings.SMTP_HOST || !bindings.SMTP_USER || !bindings.SMTP_PASS || !Number.isFinite(smtpPort) || smtpPort <= 0) {
    throw new Error('SMTP configuration is incomplete.')
  }

  const memberName = member.ar_name?.trim() || member.en_name?.trim() || member.membership_number
  const text = [
    `مرحباً ${memberName}`,
    '',
    'استلمنا طلب استعادة معلومات العضوية الخاصة بك.',
    `رقم العضوية: ${member.membership_number}`,
    `البريد الإلكتروني: ${member.email}`,
    member.phone_number ? `رقم الهاتف: ${member.phone_number}` : 'رقم الهاتف: غير متوفر',
    '',
    'إذا رغبت بتعديل كلمة المرور يمكنك استخدام الرابط التالي:',
    resetUrl,
    '',
    'صلاحية الرابط: ساعة واحدة.',
    '',
    'إذا لم تطلب هذا الإجراء، يرجى تجاهل هذه الرسالة.',
  ].join('\n')

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.8;">
      <p>مرحباً ${memberName}</p>
      <p>استلمنا طلب استعادة معلومات العضوية الخاصة بك.</p>
      <p>
        <strong>رقم العضوية:</strong> ${member.membership_number}<br />
        <strong>البريد الإلكتروني:</strong> ${member.email}<br />
        <strong>رقم الهاتف:</strong> ${member.phone_number ?? 'غير متوفر'}
      </p>
      <p>إذا رغبت بتعديل كلمة المرور، اضغط الزر التالي:</p>
      <p>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 700;"
          target="_blank"
          rel="noopener noreferrer"
        >
          تعديل كلمة المرور
        </a>
      </p>
      <p>صلاحية الرابط: ساعة واحدة.</p>
      <p style="color: #475569;">إذا لم تطلب هذا الإجراء، يرجى تجاهل هذه الرسالة.</p>
    </div>
  `

  let mailer: Awaited<ReturnType<typeof WorkerMailer.connect>> | null = null

  try {
    mailer = await WorkerMailer.connect({
      host: bindings.SMTP_HOST,
      port: smtpPort,
      secure: false,
      startTls: true,
      credentials: {
        username: bindings.SMTP_USER,
        password: bindings.SMTP_PASS,
      },
      authType: 'plain',
    })

    await mailer.send({
      from: bindings.SMTP_USER,
      to: member.email,
      subject: 'استعادة معلومات العضوية',
      text,
      html,
    })
  } finally {
    if (mailer) {
      await mailer.close()
    }
  }
}

authRoute.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const identifier = payload.identifier.trim()
    const isEmailIdentifier = identifier.includes('@')

    const user = isEmailIdentifier
      ? await getUserByEmail(c.env.MEMBERS_DB, identifier)
      : await getUserByMembershipNumber(c.env.MEMBERS_DB, identifier)

    if (!user) {
      return c.json({ error: 'Invalid email or password.' }, 401)
    }

    const passwordOk = await verifyPassword(payload.password, user.password_hash)
    if (!passwordOk) {
      return c.json({ error: 'Invalid email or password.' }, 401)
    }

    return c.json({
      user: {
        membershipNumber: user.membership_number,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Failed to login', error)
    return c.json({ error: 'Could not log in.' }, 500)
  }
})

authRoute.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const member = await findMemberByRecoveryInput(c.env, payload)

    if (!member) {
      return c.json({
        success: true,
        found: false,
        message: 'If the provided information is valid, details will be sent to your email.',
      })
    }

    const token = await createPasswordResetToken(c.env, member)
    const frontendBaseUrl = normalizeBaseUrl(c.env.FRONTEND_BASE_URL || new URL(c.req.url).origin)
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`

    await sendRecoveryEmail(c.env, member, resetUrl)

    let telegramSent = false
    if (member.telegram_id?.trim()) {
      const result = await sendBackendTelegramNotification(c.env, {
        target: member.membership_number,
        message:
          `استعادة معلومات العضوية\n` +
          `رقم العضوية: ${member.membership_number}\n` +
          `البريد الإلكتروني: ${member.email}\n` +
          `اضغط الزر أدناه لتعديل كلمة المرور.`,
        boxes: [
          {
            text: 'تعديل كلمة المرور',
            link: resetUrl,
          },
        ],
      })

      if (result.success) {
        telegramSent = true
      } else {
        console.warn('Failed to send forgot-password telegram notification', {
          membershipNumber: member.membership_number,
          status: result.status,
          error: result.error,
        })
      }
    }

    return c.json({
      success: true,
      found: true,
      message: 'If the provided information is valid, details will be sent to your email.',
      maskedEmail: maskEmail(member.email),
      telegramSent,
    })
  } catch (error) {
    console.error('Failed to process forgot-password request', error)
    return c.json({ error: 'Could not process forgot-password request.' }, 500)
  }
})

authRoute.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const payload = c.req.valid('json')
    const tokenPayload = await verifyPasswordResetToken(c.env, payload.token)

    if (!tokenPayload) {
      return c.json({ error: 'Invalid or expired reset token.' }, 400)
    }

    const user = await getUserByMembershipNumber(c.env.MEMBERS_DB, tokenPayload.membershipNumber)
    if (!user || user.email.toLowerCase() !== tokenPayload.email.toLowerCase()) {
      return c.json({ error: 'Invalid or expired reset token.' }, 400)
    }

    const nextPasswordHash = await hashPassword(payload.newPassword)
    await updateUserPasswordHash(c.env.MEMBERS_DB, tokenPayload.membershipNumber, nextPasswordHash)

    return c.json({ success: true, message: 'Password updated successfully.' })
  } catch (error) {
    console.error('Failed to reset password', error)
    return c.json({ error: 'Could not reset password.' }, 500)
  }
})
