type SpeechRecognitionConstructor = new () => SpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    return false
  }

  const SpeechRecognitionCtor = getSpeechRecognitionConstructor()
  if (!SpeechRecognitionCtor) {
    return false
  }

  try {
    const recognition = new SpeechRecognitionCtor()
    return typeof recognition.start === 'function' && typeof recognition.stop === 'function'
  } catch {
    return false
  }
}

export function resolveSpeechRecognitionLanguage(): string {
  const documentLang = document.documentElement.lang?.trim()
  if (documentLang) {
    return documentLang
  }

  const navigatorLang = navigator.language?.trim()
  if (navigatorLang) {
    return navigatorLang
  }

  return 'ar-SA'
}

export function appendSpeechTranscript(base: string, spoken: string): string {
  const trimmedSpoken = spoken.trim()
  if (!trimmedSpoken) {
    return base
  }

  if (!base.trim()) {
    return trimmedSpoken
  }

  const needsSpace = !/\s$/.test(base)
  return `${base}${needsSpace ? ' ' : ''}${trimmedSpoken}`
}
