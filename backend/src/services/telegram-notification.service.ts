import type { AppBindings } from '../types/bindings'

export interface TelegramNotificationPayload {
  target: string
  message: string
}

export interface TelegramNotificationResult {
  success: boolean
  status?: number
  error?: string
  detail?: string
  responseData?: unknown
}

export async function sendBackendTelegramNotification(
  bindings: AppBindings,
  payload: TelegramNotificationPayload,
): Promise<TelegramNotificationResult> {
  const telegramMsBaseUrl = bindings.TELEGRAM_MS?.trim()
  const internalSecret = bindings.INTERNAL_SECRET?.trim()

  if (!telegramMsBaseUrl) {
    return {
      success: false,
      status: 500,
      error: 'TELEGRAM_MS environment variable is not configured',
    }
  }

  if (!internalSecret) {
    return {
      success: false,
      status: 500,
      error: 'INTERNAL_SECRET environment variable is not configured',
    }
  }

  const baseUrl = telegramMsBaseUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/api/send-message`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': internalSecret,
      },
      body: JSON.stringify({
        target: payload.target,
        message: payload.message,
      }),
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: 'Failed to deliver notification via telegram-ms',
        responseData,
      }
    }

    return {
      success: true,
      status: response.status,
      detail: 'Notification delivered via telegram-ms',
      responseData,
    }
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
