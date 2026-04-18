import type { AppBindings } from '../types/bindings'

export interface TelegramNotificationPayload {
  target?: string
  targets?: string[]
  message: string
  boxes?: Array<{ text: string, link: string }>
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
  
  // Determine endpoint and payload based on whether we're sending to multiple targets or single target
  let url: string;
  let requestBody: any;
  
  if (payload.targets && payload.targets.length > 0) {
    // Send to multiple membership numbers
    url = `${baseUrl}/api/notify-member`;
    requestBody = {
      member_ids: payload.targets,
      message: payload.message,
      boxes: payload.boxes,
    };
  } else if (payload.target) {
    // Send to single target (existing behavior)
    url = `${baseUrl}/api/notify-member`;
    requestBody = {
      member_id: payload.target,
      message: payload.message,
      boxes: payload.boxes,
    };
  } else {
    return {
      success: false,
      status: 400,
      error: 'Either target or targets must be provided',
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': internalSecret,
      },
      body: JSON.stringify(requestBody),
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
