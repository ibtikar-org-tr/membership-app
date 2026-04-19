import { type FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/vms'

interface ResetTokenPreview {
  membershipNumber: string
  email: string
  exp: number
}

function base64UrlToUtf8(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(normalized + padding)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new TextDecoder().decode(bytes)
}

function parseTokenPreview(token: string): ResetTokenPreview | null {
  const [payloadPart] = token.split('.')
  if (!payloadPart) {
    return null
  }

  try {
    const parsed = JSON.parse(base64UrlToUtf8(payloadPart)) as Partial<ResetTokenPreview>
    if (
      typeof parsed.membershipNumber !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null
    }

    return {
      membershipNumber: parsed.membershipNumber,
      email: parsed.email,
      exp: parsed.exp,
    }
  } catch {
    return null
  }
}

function formatExpiryDate(exp: number): string {
  const date = new Date(exp * 1000)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}, ${getPart('hour')}:${getPart('minute')} (GMT+3)`
}

function formatTimeLeft(exp: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const remainingSeconds = exp - nowSeconds

  if (remainingSeconds <= 0) {
    return 'انتهت الصلاحية'
  }

  const remainingMinutes = Math.ceil(remainingSeconds / 60)
  if (remainingMinutes < 60) {
    return `متبقي ${remainingMinutes} دقيقة`
  }

  const hours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60
  if (minutes === 0) {
    return `متبقي ${hours} ساعة`
  }

  return `متبقي ${hours} ساعة و${minutes} دقيقة`
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])
  const tokenPreview = useMemo(() => parseTokenPreview(token), [token])
  const isTokenExpired = useMemo(() => {
    if (!tokenPreview) {
      return false
    }

    return tokenPreview.exp <= Math.floor(Date.now() / 1000)
  }, [tokenPreview])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!token) {
      setErrorMessage('رابط إعادة التعيين غير صالح أو مفقود.')
      return
    }

    if (isTokenExpired) {
      setErrorMessage('انتهت صلاحية الرابط. أعد طلب رابط جديد من صفحة الاستعادة.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get('newPassword') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    if (newPassword.length < 8) {
      setErrorMessage('يجب أن تكون كلمة المرور 8 أحرف على الأقل.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({ token, newPassword })
      setSuccessMessage('تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.')
      event.currentTarget.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setErrorMessage(requestError.message)
      } else {
        setErrorMessage('تعذر تحديث كلمة المرور حالياً.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-amber-50 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <section className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur md:p-10">
          <p className="inline-block rounded-full bg-cyan-100 px-4 py-1 text-sm font-semibold text-cyan-800">
            إعادة تعيين كلمة المرور
          </p>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            تعديل كلمة المرور
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            أدخل كلمة مرور جديدة لحسابك. صلاحية الرابط مؤقتة.
          </p>

          {tokenPreview ? (
            <div className="mt-6 space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm text-cyan-900">
              <p>
                رقم العضوية: <span dir="ltr" className="font-mono">{tokenPreview.membershipNumber}</span>
              </p>
              <p>
                البريد الإلكتروني: <span dir="ltr" className="font-mono">{tokenPreview.email}</span>
              </p>
              <p>
                ينتهي الرابط في:{' '}
                <span dir="ltr" className="inline-block font-mono font-semibold" style={{ unicodeBidi: 'isolate' }}>
                  {formatExpiryDate(tokenPreview.exp)}
                </span>
              </p>
              <p className={isTokenExpired ? 'font-semibold text-rose-700' : 'font-semibold text-cyan-800'}>
                {formatTimeLeft(tokenPreview.exp)}
              </p>
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
            <p className="font-semibold">إرشادات سريعة</p>
            <p>اكتب كلمة مرور جديدة لا تقل عن 8 أحرف ويفضل أن تحتوي على أرقام ورموز.</p>
            <p>بعد الحفظ، استخدم كلمة المرور الجديدة مباشرة في صفحة تسجيل الدخول.</p>
          </div>

          {!token ? (
            <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              الرابط غير صالح. أعد طلب الاستعادة من صفحة نسيت معلومات العضوية.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  كلمة المرور الجديدة
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  placeholder="8 أحرف على الأقل"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  تأكيد كلمة المرور
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>

              {errorMessage ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || isTokenExpired}
                className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
              >
                {isSubmitting ? 'جار التحديث...' : 'حفظ كلمة المرور الجديدة'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-slate-800 underline-offset-4 hover:underline">
              العودة إلى تسجيل الدخول
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
