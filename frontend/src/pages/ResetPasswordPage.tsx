import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchResetPasswordStatus, resetPassword } from '../api/vms'
import { Seo } from '../components/Seo'
import type { ResetPasswordStatusResponse } from '../types/auth'

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

function statusMessage(status: ResetPasswordStatusResponse | null): string | null {
  if (!status || status.valid) {
    return null
  }

  if (status.reason === 'used') {
    return 'تم استخدام هذا الرابط مسبقاً ولم يعد صالحاً. إن احتجت إعادة التعيين مجدداً، اطلب رابطاً جديداً.'
  }

  if (status.reason === 'expired') {
    return 'انتهت صلاحية الرابط. أعد طلب رابط جديد من صفحة الاستعادة.'
  }

  if (status.reason === 'missing') {
    return 'الرابط غير صالح. أعد طلب الاستعادة من صفحة نسيت معلومات العضوية.'
  }

  return 'رابط إعادة التعيين غير صالح أو منتهٍ. أعد طلب رابط جديد من صفحة الاستعادة.'
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])

  const [tokenStatus, setTokenStatus] = useState<ResetPasswordStatusResponse | null>(null)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [didReset, setDidReset] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkToken() {
      if (!token) {
        setTokenStatus({ valid: false, reason: 'missing' })
        setIsCheckingToken(false)
        return
      }

      setIsCheckingToken(true)

      try {
        const status = await fetchResetPasswordStatus(token)
        if (!cancelled) {
          setTokenStatus(status)
        }
      } catch {
        if (!cancelled) {
          setTokenStatus({ valid: false, reason: 'invalid' })
        }
      } finally {
        if (!cancelled) {
          setIsCheckingToken(false)
        }
      }
    }

    void checkToken()

    return () => {
      cancelled = true
    }
  }, [token])

  const canShowForm = Boolean(tokenStatus?.valid) && !didReset

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    setSuccessMessage(null)
    setErrorMessage(null)

    if (!token || !tokenStatus?.valid) {
      setErrorMessage('رابط إعادة التعيين غير صالح أو مفقود.')
      return
    }

    const formData = new FormData(form)
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
      const payload = await resetPassword({ token, newPassword })
      setDidReset(true)
      setTokenStatus({ valid: false, reason: 'used' })
      setSuccessMessage(payload.message || 'تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.')
      form.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setErrorMessage(requestError.message)
        if (requestError.message.includes('مسبقاً') || requestError.message.includes('استُخدم')) {
          setDidReset(false)
          setTokenStatus({ valid: false, reason: 'used' })
        }
      } else {
        setErrorMessage('تعذر تحديث كلمة المرور حالياً.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Seo
        title="إعادة تعيين كلمة المرور"
        description="أنشئ كلمة مرور جديدة لحسابك في منصة أعضاء إبتكار عبر رابط إعادة التعيين المؤقت."
        noIndex
      />
      <main className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-amber-50 px-6 py-10 text-slate-800" dir="rtl">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
          <section className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur md:p-10">
            <p className="inline-block rounded-full bg-cyan-100 px-4 py-1 text-sm font-semibold text-cyan-800">
              إعادة تعيين كلمة المرور
            </p>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {didReset ? 'تم التحديث بنجاح' : 'تعديل كلمة المرور'}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {didReset
                ? 'تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول بالحساب.'
                : 'أدخل كلمة مرور جديدة لحسابك. صلاحية الرابط مؤقتة ولمرة واحدة فقط.'}
            </p>

            {isCheckingToken ? (
              <p className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                جارٍ التحقق من صلاحية الرابط...
              </p>
            ) : null}

            {!isCheckingToken && tokenStatus?.valid ? (
              <div className="mt-6 space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-4 text-sm text-cyan-900">
                <p>
                  رقم العضوية: <span dir="ltr" className="font-mono">{tokenStatus.membershipNumber}</span>
                </p>
                <p>
                  البريد الإلكتروني: <span dir="ltr" className="font-mono">{tokenStatus.email}</span>
                </p>
                <p>
                  ينتهي الرابط في:{' '}
                  <span dir="ltr" className="inline-block font-mono font-semibold" style={{ unicodeBidi: 'isolate' }}>
                    {formatExpiryDate(tokenStatus.exp)}
                  </span>
                </p>
                <p className="font-semibold text-cyan-800">{formatTimeLeft(tokenStatus.exp)}</p>
              </div>
            ) : null}

            {didReset && successMessage ? (
              <div className="mt-8 space-y-4">
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </p>
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  أصبح هذا الرابط غير صالح ولن يمكن استخدامه مرة أخرى.
                </p>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
                >
                  الانتقال إلى تسجيل الدخول
                </Link>
              </div>
            ) : null}

            {!isCheckingToken && !didReset && !canShowForm ? (
              <div className="mt-8 space-y-4">
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {statusMessage(tokenStatus)}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/iforgot"
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    طلب رابط جديد
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              </div>
            ) : null}

            {canShowForm ? (
              <>
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                  <p className="font-semibold">إرشادات سريعة</p>
                  <p>اكتب كلمة مرور جديدة لا تقل عن 8 أحرف ويفضل أن تحتوي على أرقام ورموز.</p>
                  <p>بعد الحفظ يصبح الرابط غير صالح ولن يعمل مجدداً.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                  <div>
                    <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        minLength={8}
                        required
                        autoComplete="new-password"
                        dir="ltr"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-left text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                        placeholder="8 أحرف على الأقل"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((current) => !current)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-800"
                        aria-label={showNewPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        minLength={8}
                        required
                        autoComplete="new-password"
                        dir="ltr"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-left text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                        placeholder="أعد كتابة كلمة المرور"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-800"
                        aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>

                  {errorMessage ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {errorMessage}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'جار التحديث...' : 'حفظ كلمة المرور الجديدة'}
                  </button>
                </form>
              </>
            ) : null}

            {!didReset ? (
              <p className="mt-6 text-center text-sm text-slate-600">
                <Link to="/login" className="font-semibold text-slate-800 underline-offset-4 hover:underline">
                  العودة إلى تسجيل الدخول
                </Link>
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </>
  )
}
