export interface TelegramMemberContact {
  telegramId?: string | null
  telegramUsername?: string | null
  email?: string | null
  phoneNumber?: string | null
}

/**
 * Inline keyboard URL for messaging a member. Only @username links work reliably;
 * tg://user?id= triggers BUTTON_USER_PRIVACY_RESTRICTED when the user has no username.
 */
export function buildMemberTelegramDmLink(contact: TelegramMemberContact): string | null {
  const username = contact.telegramUsername?.trim().replace(/^@+/, '')
  if (!username) {
    return null
  }

  return `https://t.me/${encodeURIComponent(username)}`
}

export function memberHasTelegramWithoutUsername(contact: TelegramMemberContact): boolean {
  const hasUsername = Boolean(contact.telegramUsername?.trim())
  const hasTelegramId = Boolean(contact.telegramId?.trim())
  return hasTelegramId && !hasUsername
}

export function buildMemberContactFallbackLines(contact: TelegramMemberContact): string[] {
  const lines: string[] = []

  if (contact.phoneNumber?.trim()) {
    lines.push(`📞 الهاتف: ${contact.phoneNumber.trim()}`)
  }

  if (contact.email?.trim()) {
    lines.push(`📧 البريد: ${contact.email.trim()}`)
  }

  return lines
}
