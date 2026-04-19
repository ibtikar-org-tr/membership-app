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
  const telegramMsService = bindings.TELEGRAM_MS_SERVICE
  const telegramMsBaseUrl = bindings.TELEGRAM_MS?.trim()
  const endpointPath = '/ms/telegram/api/notify-member'
  const internalSecret = bindings.INTERNAL_SECRET?.trim()

  if (!telegramMsService && !telegramMsBaseUrl) {
    return {
      success: false,
      status: 500,
      error: 'Neither TELEGRAM_MS_SERVICE binding nor TELEGRAM_MS URL is configured',
    }
  }

  if (!internalSecret) {
    return {
      success: false,
      status: 500,
      error: 'INTERNAL_SECRET environment variable is not configured',
    }
  }

  const baseUrl = telegramMsBaseUrl ? telegramMsBaseUrl.replace(/\/+$/, '') : undefined
  
  // Determine endpoint and payload based on whether we're sending to multiple targets or single target
  let requestBody: any;
  
  if (payload.targets && payload.targets.length > 0) {
    // Send to multiple membership numbers
    requestBody = {
      member_ids: payload.targets,
      message: payload.message,
      boxes: payload.boxes,
    }
  } else if (payload.target) {
    // Send to single target (existing behavior)
    requestBody = {
      member_id: payload.target,
      message: payload.message,
      boxes: payload.boxes,
    }
  } else {
    return {
      success: false,
      status: 400,
      error: 'Either target or targets must be provided',
    }
  }

  const requestUrl = baseUrl ? `${baseUrl}/api/notify-member` : undefined
  const bindingRequestUrl = `https://telegram-ms.internal${endpointPath}`
  const targetDescriptor = telegramMsService ? `service-binding:${endpointPath}` : requestUrl

  try {
    const response = telegramMsService
      ? await telegramMsService.fetch(bindingRequestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': internalSecret,
        },
        body: JSON.stringify(requestBody),
      })
      : await fetch(requestUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': internalSecret,
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text().catch(() => '')
    let responseData: unknown = null
    if (responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }
    }

    if (!response.ok) {
      const allowHeader = response.headers.get('allow')
      const contentType = response.headers.get('content-type')
      const server = response.headers.get('server')
      const cfRay = response.headers.get('cf-ray')
      const failureMeta = {
        requestUrl: targetDescriptor,
        status: response.status,
        statusText: response.statusText,
        allow: allowHeader,
        contentType,
        server,
        cfRay,
      }

      console.warn('Telegram MS non-OK response metadata:', failureMeta)
      if (responseText) {
        console.warn('Telegram MS non-OK response body preview:', responseText.slice(0, 500))
      }

      return {
        success: false,
        status: response.status,
        error: 'Failed to deliver notification via telegram-ms',
        responseData: {
          ...failureMeta,
          body: responseData,
        },
      }
    }

    return {
      success: true,
      status: response.status,
      detail: 'Notification delivered via telegram-ms',
      responseData,
    }
  } catch (error) {
    console.error('Telegram notification request failed:', {
      requestUrl: targetDescriptor,
      error: error instanceof Error ? error.message : error,
    })
    return {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseData: {
        requestUrl: targetDescriptor,
      },
    }
  }
}
