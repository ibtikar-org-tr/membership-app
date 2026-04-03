import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

type RecoverFormState = {
  email: string
  membershipNumber: string
  phoneNumber: string
}

const initialFormState: RecoverFormState = {
  email: '',
  membershipNumber: '',
  phoneNumber: '',
}

export function IForgotPage() {
  const [formState, setFormState] = useState<RecoverFormState>(initialFormState)
  const [submitted, setSubmitted] = useState(false)
  const [showIdentityError, setShowIdentityError] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.membershipNumber.trim() && !formState.phoneNumber.trim()) {
      setShowIdentityError(true)
      setSubmitted(false)
      return
    }

    setShowIdentityError(false)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-3xl border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur md:p-10">
          <p className="inline-block rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
            استرجاع معلومات العضوية
          </p>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            نسيت معلومات الدخول؟
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            أدخل البريد الإلكتروني، ثم رقم العضوية أو رقم الهاتف للتحقق من هويتك.
            سنرسل معلوماتك عبر البريد الإلكتروني.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="recover-email" className="mb-2 block text-sm font-semibold text-slate-700">
                البريد الإلكتروني
              </label>
              <input
                id="recover-email"
                name="recover-email"
                type="email"
                autoComplete="email"
                required
                value={formState.email}
                onChange={(event) => {
                  setFormState((previous) => ({ ...previous, email: event.target.value }))
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                placeholder="example@domain.com"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="membership-number" className="mb-2 block text-sm font-semibold text-slate-700">
                  رقم العضوية
                </label>
                <input
                  id="membership-number"
                  name="membership-number"
                  type="text"
                  value={formState.membershipNumber}
                  onChange={(event) => {
                    setFormState((previous) => ({ ...previous, membershipNumber: event.target.value }))
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="M-1024"
                />
              </div>

              <div>
                <label htmlFor="phone-number" className="mb-2 block text-sm font-semibold text-slate-700">
                  رقم الهاتف
                </label>
                <input
                  id="phone-number"
                  name="phone-number"
                  type="tel"
                  autoComplete="tel"
                  value={formState.phoneNumber}
                  onChange={(event) => {
                    setFormState((previous) => ({ ...previous, phoneNumber: event.target.value }))
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
            </div>

            {showIdentityError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                يرجى إدخال رقم العضوية أو رقم الهاتف على الأقل.
              </p>
            ) : null}

            {submitted ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                تم استلام الطلب. إذا كانت البيانات صحيحة، سنرسل المعلومات إلى بريدك الإلكتروني.
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              استرجاع المعلومات
            </button>

            <p className="text-center text-sm text-slate-600">
              <Link to="/login" className="font-semibold text-slate-800 underline-offset-4 hover:underline">
                العودة إلى تسجيل الدخول
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}