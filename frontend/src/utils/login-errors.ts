export class TelegramActivationRequiredError extends Error {
  readonly code = 'TELEGRAM_BOT_REQUIRED' as const

  constructor(message: string) {
    super(message)
    this.name = 'TelegramActivationRequiredError'
  }
}

export function isTelegramActivationRequiredError(error: unknown): error is TelegramActivationRequiredError {
  return error instanceof TelegramActivationRequiredError
}
