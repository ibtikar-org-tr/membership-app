export interface TelegramMemberContact {
  telegramId?: string | null
  telegramUsername?: string | null
  email?: string | null
  phoneNumber?: string | null
}

/** Same link pattern as task assignment "contact project owner" buttons. */
export function buildMemberTelegramDmLink(contact: TelegramMemberContact): string | null {
  const username = contact.telegramUsername?.trim().replace(/^@+/, '')
  if (username) {
    return `https://t.me/${encodeURIComponent(username)}`
  }

  const telegramId = contact.telegramId?.trim()
  if (telegramId) {
    return `tg://user?id=${encodeURIComponent(telegramId)}`
  }

  return null
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
