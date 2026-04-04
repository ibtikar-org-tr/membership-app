import type { AppBindings } from '../types/bindings'
import { WorkerMailer } from 'worker-mailer'

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
    throw new Error('SMTP configuration is incomplete. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS.')
  }

  const smtpPort = Number.parseInt(String(bindings.SMTP_PORT ?? '587'), 10)
  if (!Number.isFinite(smtpPort) || smtpPort <= 0) {
    throw new Error('SMTP_PORT must be a valid positive number.')
  }

  const text = [
    'Welcome to Ibtikar.',
    `Membership Number: ${params.membershipNumber}`,
    `Temporary Password: ${params.temporaryPassword}`,
    'Please log in and change your password immediately.',
  ].join('\n')

  const mailer = await WorkerMailer.connect({
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

  try {
    await mailer.send({
      from: bindings.SMTP_USER,
      to: params.recipientEmail,
      subject: 'Your Membership Account Credentials',
      text,
      html: text,
    })
  } finally {
    await mailer.close()
  }
}
