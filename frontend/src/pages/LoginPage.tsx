import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/vms'
import { setStoredUser } from '../utils/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const identifier = String(formData.get('identifier') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!identifier || !password) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم العضوية وكلمة المرور.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await login({ identifier, password })
      setStoredUser(payload.user)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message)
      } else {
        setError('تعذر تسجيل الدخول.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-amber-50 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl backdrop-blur md:grid-cols-2">
          <div className="space-y-6 bg-linear-to-br from-slate-900 via-slate-800 to-cyan-900 p-8 text-white md:p-10">
            <p className="inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-semibold text-cyan-100">
              بوابة الأعضاء
            </p>
            <h1 className="text-3xl font-black leading-tight md:text-4xl">تسجيل الدخول إلى حسابك</h1>
            <p className="text-sm leading-7 text-slate-200">
              استخدم بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكّم.
            </p>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-cyan-50">
              لسع عضواً في تجمّع إبتكار؟{' '}
              {' '}
              <Link to="/registration" className="font-semibold text-amber-200 underline-offset-4 hover:underline">
                قم بالانتساب للتجمّع الآن
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-8 md:p-10" noValidate>
            <div>
              <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-slate-700">
                البريد الإلكتروني أو رقم العضوية
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="example@domain.com / 2503017"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="********"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" name="remember" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                تذكرني
              </label>
              <Link to="/iforgot" className="font-medium text-cyan-700 transition hover:text-cyan-900">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              {isSubmitting ? 'جار تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>

            {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <p className="text-center text-sm text-slate-600">
              <Link to="/" className="font-semibold text-slate-800 underline-offset-4 hover:underline">
                العودة إلى الصفحة الرئيسية
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}