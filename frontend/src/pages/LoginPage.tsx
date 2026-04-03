import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

export function LoginPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-amber-50 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl backdrop-blur md:grid-cols-2">
          <div className="space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-8 text-white md:p-10">
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
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="example@domain.com"
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
                minLength={8}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="********"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" name="remember" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                تذكرني
              </label>
              <button type="button" className="font-medium text-cyan-700 transition hover:text-cyan-900">
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              تسجيل الدخول
            </button>

            {submitted ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                تم إرسال بيانات الدخول بنجاح (واجهة فقط حاليًا).
              </p>
            ) : null}

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