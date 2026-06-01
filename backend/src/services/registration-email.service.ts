import type { AppBindings } from '../types/bindings'
import { WorkerMailer } from 'worker-mailer'
import { RegistrationEmailError } from '../errors/registration.errors'
import {
  buildRegistrationCredentialsEmailHtml,
  buildRegistrationCredentialsEmailText,
  resolveRegistrationEmailUrls,
} from '../templates/registration-credentials-email'

interface SendRegistrationCredentialsEmailParams {
  recipientEmail: string
  membershipNumber: string
  temporaryPassword: string
}

export async function sendRegistrationCredentialsEmail(
  bindings: AppBindings,
  params: SendRegistrationCredentialsEmailParams,
): Promise<void> {
  if (!bindings.SMTP_HOST || !bindings.SMTP_USER || !bindings.SMTP_PASS) {
    throw new RegistrationEmailError(
      'SMTP configuration is incomplete. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS. يرجى التواصل مع الأدمين وإخباره',
    )
  }

  const smtpPort = Number.parseInt(String(bindings.SMTP_PORT ?? '587'), 10)
  if (!Number.isFinite(smtpPort) || smtpPort <= 0) {
    throw new RegistrationEmailError('SMTP_PORT must be a valid positive number. يرجى التواصل مع الأدمين وإخباره')
  }

  const urls = resolveRegistrationEmailUrls(bindings.FRONTEND_BASE_URL)
  const emailContent = {
    membershipNumber: params.membershipNumber,
    temporaryPassword: params.temporaryPassword,
    ...urls,
  }

  const text = buildRegistrationCredentialsEmailText(emailContent)
  const html = buildRegistrationCredentialsEmailHtml(emailContent)

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
      to: params.recipientEmail,
      subject: 'مرحباً بك في تجمّع إبتكار — بيانات حساب العضوية',
      text,
      html,
    })
  } catch (error) {
    throw new RegistrationEmailError('Unable to send registration credentials email at this time. يرجى التواصل مع الأدمين وإخباره', { cause: error })
  } finally {
    if (mailer) {
      await mailer.close()
    }
  }
}
