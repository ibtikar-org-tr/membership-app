import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { WorkerMailer } from 'worker-mailer'
import { getUserByEmail, getUserByMembershipNumber } from '../repositories/users.repository'
import { forgotPasswordSchema, type ForgotPasswordInput, loginSchema } from '../schemas/auth.schema'
import { sendBackendTelegramNotification } from '../services/telegram-notification.service'
import type { AppBindings } from '../types/bindings'
import { verifyPassword } from '../utils/password'

export const authRoute = new Hono<{ Bindings: AppBindings }>()

interface ForgotMemberRow {
  membership_number: string
  email: string
  en_name: string | null
  ar_name: string | null
  phone_number: string | null
  telegram_id: string | null
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

async function sendRecoveryEmail(bindings: AppBindings, member: ForgotMemberRow): Promise<void> {
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
    'إذا لم تطلب هذا الإجراء، يرجى تجاهل هذه الرسالة.',
  ].join('\n')

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
      html: text,
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

    await sendRecoveryEmail(c.env, member)

    let telegramSent = false
    if (member.telegram_id?.trim()) {
      const result = await sendBackendTelegramNotification(c.env, {
        target: member.membership_number,
        message: `استعادة معلومات العضوية\nرقم العضوية: ${member.membership_number}\nالبريد الإلكتروني: ${member.email}`,
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
