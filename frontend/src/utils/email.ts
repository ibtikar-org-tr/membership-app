const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COMMON_DOMAIN_FIXES: Record<string, string> = {
  gmailcom: 'gmail.com',
  googlemailcom: 'googlemail.com',
  hotmailcom: 'hotmail.com',
  hotmailcouk: 'hotmail.co.uk',
  outlookcom: 'outlook.com',
  yahoocom: 'yahoo.com',
  icloudcom: 'icloud.com',
  livecom: 'live.com',
  protonme: 'proton.me',
  protonmailcom: 'protonmail.com',
}

const KNOWN_DOMAIN_PREFIXES = [
  'gmail',
  'googlemail',
  'hotmail',
  'outlook',
  'yahoo',
  'icloud',
  'live',
  'proton',
  'protonmail',
]

export function splitEmailParts(email: string) {
  const atIndex = email.indexOf('@')
  if (atIndex === -1) {
    return {
      localPart: email,
      domainPart: '',
    }
  }

  return {
    localPart: email.slice(0, atIndex),
    domainPart: email.slice(atIndex + 1),
  }
}

function stripDuplicateLocalPrefix(localPart: string, domainPart: string) {
  const local = localPart.trim().toLowerCase()
  const domain = domainPart.trim().toLowerCase()

  if (!local || !domain.startsWith(local)) {
    return domainPart.trim().toLowerCase()
  }

  const remainder = domain.slice(local.length)
  const looksLikeKnownDomain = KNOWN_DOMAIN_PREFIXES.some((prefix) => remainder.startsWith(prefix))

  return looksLikeKnownDomain ? remainder : domainPart.trim().toLowerCase()
}

function fixCommonDomainTypos(domainPart: string) {
  const domain = domainPart.trim().toLowerCase().replaceAll('@', '')
  if (!domain) {
    return domain
  }

  if (COMMON_DOMAIN_FIXES[domain]) {
    return COMMON_DOMAIN_FIXES[domain]
  }

  for (const [broken, fixed] of Object.entries(COMMON_DOMAIN_FIXES)) {
    if (domain.endsWith(broken) && domain.length > broken.length) {
      return `${domain.slice(0, -broken.length)}${fixed}`
    }
  }

  return domain
}

export function normalizeEmailParts(localPart: string, domainPart: string) {
  const trimmedLocal = localPart.trim()
  let trimmedDomain = domainPart.trim().toLowerCase().replaceAll('@', '')

  trimmedDomain = stripDuplicateLocalPrefix(trimmedLocal, trimmedDomain)
  trimmedDomain = fixCommonDomainTypos(trimmedDomain)

  return {
    localPart: trimmedLocal,
    domainPart: trimmedDomain,
  }
}

export function composeEmail(localPart: string, domainPart: string) {
  const { localPart: normalizedLocal, domainPart: normalizedDomain } = normalizeEmailParts(localPart, domainPart)
  const hasAnyPart = normalizedLocal.length > 0 || normalizedDomain.length > 0

  return hasAnyPart ? `${normalizedLocal}@${normalizedDomain}` : ''
}

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email.trim())
}

export function getEmailValidationMessage(email: string) {
  const trimmed = email.trim()
  if (!trimmed) {
    return null
  }

  if (isValidEmail(trimmed)) {
    return null
  }

  const { domainPart } = splitEmailParts(trimmed)
  if (domainPart && !domainPart.includes('.')) {
    return 'يبدو أن نطاق البريد ناقصاً. اكتب gmail.com وليس gmailcom، ولا تكرّر اسم المستخدم بعد @.'
  }

  return 'البريد الإلكتروني غير صالح. اكتب الصيغة الصحيحة مثل: name@gmail.com'
}
