import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { changePassword } from '../../api/vms'

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword.length < 8) {
      setError('يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('تأكيد كلمة المرور غير متطابق.')
      return
    }

    if (currentPassword === newPassword) {
      setError('يجب أن تختلف كلمة المرور الجديدة عن الحالية.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await changePassword({ currentPassword, newPassword })
      setSuccess(payload.message || 'تم تحديث كلمة المرور بنجاح.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحديث كلمة المرور.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-slate-950 p-3 text-white">
          <KeyRound className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">تغيير كلمة المرور</h2>
          <p className="mt-1 text-sm text-slate-600">
            يمكنك تحديث كلمة المرور من هنا دون الحاجة إلى رابط الاستعادة. نسيت كلمة المرور؟{' '}
            <Link to="/iforgot" className="font-semibold text-cyan-700 underline-offset-2 hover:underline">
              استخدم نسيت كلمة المرور
            </Link>
            .
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:max-w-xl">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">كلمة المرور الحالية</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pe-11 ps-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((value) => !value)}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label={showCurrent ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">كلمة المرور الجديدة</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pe-11 ps-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            <button
              type="button"
              onClick={() => setShowNew((value) => !value)}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label={showNew ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-600">تأكيد كلمة المرور الجديدة</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pe-11 ps-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500 md:w-auto md:self-start"
        >
          {isSubmitting ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
        </button>
      </form>
    </section>
  )
}
