import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendSpeechTranscript,
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  resolveSpeechRecognitionLanguage,
} from '../utils/speech-recognition'

interface UseSpeechToTextOptions {
  getBaseText: () => string
  onTranscript: (value: string) => void
  disabled?: boolean
}

interface UseSpeechToTextResult {
  isSupported: boolean
  isListening: boolean
  speechError: string | null
  toggleListening: () => void
  stopListening: () => void
}

function mapSpeechError(error: string): string {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'تم رفض إذن الميكروفون. يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.'
  }

  if (error === 'no-speech') {
    return 'لم يتم التقاط أي صوت. حاول مرة أخرى.'
  }

  if (error === 'audio-capture') {
    return 'تعذر الوصول إلى الميكروفون.'
  }

  if (error === 'network') {
    return 'تعذر الاتصال بخدمة التعرف على الصوت.'
  }

  return 'تعذر استخدام الإدخال الصوتي. حاول مرة أخرى.'
}

export function useSpeechToText({
  getBaseText,
  onTranscript,
  disabled = false,
}: UseSpeechToTextOptions): UseSpeechToTextResult {
  const [isSupported] = useState(() => isSpeechRecognitionSupported())
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const sessionBaseRef = useRef('')
  const getBaseTextRef = useRef(getBaseText)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    getBaseTextRef.current = getBaseText
    onTranscriptRef.current = onTranscript
  }, [getBaseText, onTranscript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (disabled || !isSupported) {
      return
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor()
    if (!SpeechRecognitionCtor) {
      return
    }

    sessionBaseRef.current = getBaseTextRef.current()
    setSpeechError(null)

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = resolveSpeechRecognitionLanguage()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let spoken = ''
      for (let index = 0; index < event.results.length; index += 1) {
        spoken += event.results[index][0]?.transcript ?? ''
      }

      onTranscriptRef.current(appendSpeechTranscript(sessionBaseRef.current, spoken))
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') {
        return
      }

      setSpeechError(mapSpeechError(event.error))
      stopListening()
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
    } catch {
      setSpeechError('تعذر بدء الإدخال الصوتي.')
      recognitionRef.current = null
      setIsListening(false)
    }
  }, [disabled, isSupported, stopListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
      return
    }

    startListening()
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  return {
    isSupported,
    isListening,
    speechError,
    toggleListening,
    stopListening,
  }
}
