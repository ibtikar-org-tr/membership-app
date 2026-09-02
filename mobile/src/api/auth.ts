import { apiFetch, apiPostJson, parseErrorMessage } from '@/src/api/client'
import { clearSession, getRefreshToken, setSession } from '@/src/auth/session'
import {
  TelegramActivationRequiredError,
  type LoginResponse,
} from '@/src/types/auth'

export async function login(payload: {
  identifier: string
  password: string
}): Promise<LoginResponse> {
  const response = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const { message, code } = await parseErrorMessage(response, 'تعذر تسجيل الدخول.')
    if (code === 'TELEGRAM_BOT_REQUIRED' || response.status === 403) {
      throw new TelegramActivationRequiredError(message)
    }
    throw new Error(message)
  }

  const data = (await response.json()) as LoginResponse
  await setSession({
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  })
  return data
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken()
  try {
    await apiPostJson('/logout', refreshToken ? { refreshToken } : {})
  } catch {
    // Local session is cleared regardless of network errors.
  } finally {
    await clearSession()
  }
}
