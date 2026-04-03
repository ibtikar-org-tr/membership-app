import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

type RecoveryOption = '' | 'email' | 'membershipNumber' | 'phoneNumber'

export function IForgotPage() {
  const [recoveryOption, setRecoveryOption] = useState<RecoveryOption>('')
  const [inputValue, setInputValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showSelectionError, setShowSelectionError] = useState(false)
  const [showValueError, setShowValueError] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!recoveryOption) {
      setShowSelectionError(true)
      setShowValueError(false)
      setSubmitted(false)
      return
    }

    if (!inputValue.trim()) {
      setShowSelectionError(false)
      setShowValueError(true)
      setSubmitted(false)
      return
    }

    setShowSelectionError(false)
    setShowValueError(false)
    setSubmitted(true)
  }

  const inputConfig: Record<Exclude<RecoveryOption, ''>, { id: string, label: string, type: string, placeholder: string, autoComplete?: string }> = {
    email: {
      id: 'recover-email',
      label: 'البريد الإلكتروني',
      type: 'email',
      placeholder: 'example@domain.com',
      autoComplete: 'email',
    },
    membershipNumber: {
      id: 'membership-number',
      label: 'رقم العضوية',
      type: 'text',
      placeholder: 'M-1024',
    },
    phoneNumber: {
      id: 'phone-number',
      label: 'رقم الهاتف',
      type: 'tel',
      placeholder: '+90 5xx xxx xx xx',
      autoComplete: 'tel',
    },
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
            اختر طريقة البحث أولًا، ثم أدخل القيمة المطلوبة.
            سنرسل معلوماتك عبر البريد الإلكتروني.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="recovery-option" className="mb-2 block text-sm font-semibold text-slate-700">
                طريقة البحث
              </label>
              <select
                id="recovery-option"
                name="recovery-option"
                value={recoveryOption}
                onChange={(event) => {
                  const nextOption = event.target.value as RecoveryOption
                  setRecoveryOption(nextOption)
                  setInputValue('')
                  setShowSelectionError(false)
                  setShowValueError(false)
                  setSubmitted(false)
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              >
                <option value="">اختر أحد الخيارات</option>
                <option value="email">البريد الإلكتروني</option>
                <option value="membershipNumber">رقم العضوية</option>
                <option value="phoneNumber">رقم الهاتف</option>
              </select>
            </div>

            {recoveryOption ? (
              <div>
                <label htmlFor={inputConfig[recoveryOption].id} className="mb-2 block text-sm font-semibold text-slate-700">
                  {inputConfig[recoveryOption].label}
                </label>
                <input
                  id={inputConfig[recoveryOption].id}
                  name={inputConfig[recoveryOption].id}
                  type={inputConfig[recoveryOption].type}
                  autoComplete={inputConfig[recoveryOption].autoComplete}
                  required
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value)
                    setShowValueError(false)
                    setSubmitted(false)
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder={inputConfig[recoveryOption].placeholder}
                />
              </div>
            ) : null}

            {showSelectionError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                يرجى اختيار طريقة البحث أولًا.
              </p>
            ) : null}

            {showValueError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                يرجى إدخال قيمة الحقل المختار.
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