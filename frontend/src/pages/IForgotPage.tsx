import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmailField } from '../components/registration/EmailField'
import { PhoneNumberField } from '../components/registration/PhoneNumberField'

type RecoveryOption = '' | 'email' | 'membershipNumber' | 'phoneNumber'

export function IForgotPage() {
  const [recoveryOption, setRecoveryOption] = useState<RecoveryOption>('')
  const [emailValue, setEmailValue] = useState('')
  const [membershipNumberValue, setMembershipNumberValue] = useState('')
  const [phoneNumberValue, setPhoneNumberValue] = useState('')
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

    const isEmailValid = emailValue.trim().length > 0
    const isMembershipValid = membershipNumberValue.trim().length > 0
    const phoneDigitsCount = phoneNumberValue.replace(/\D/g, '').length
    const isPhoneValid = phoneDigitsCount >= 7

    const hasValidValueByOption =
      (recoveryOption === 'email' && isEmailValid) ||
      (recoveryOption === 'membershipNumber' && isMembershipValid) ||
      (recoveryOption === 'phoneNumber' && isPhoneValid)

    if (!hasValidValueByOption) {
      setShowSelectionError(false)
      setShowValueError(true)
      setSubmitted(false)
      return
    }

    setShowSelectionError(false)
    setShowValueError(false)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <section className="w-full rounded-3xl border border-white/70 bg-white/85 p-8 shadow-2xl backdrop-blur md:p-10">
          <p className="inline-block rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
            استرجاع بيانات العضوية
          </p>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            نسيت بيانات العضويّة؟
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            اختر طريقة البحث أولًا، ثم أدخل القيمة المطلوبة.
            سنرسل معلوماتك عبر البريد الإلكتروني أو التلغرام.
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

            {recoveryOption === 'email' ? (
              <EmailField
                id="recover-email"
                label="البريد الإلكتروني"
                value={emailValue}
                onChange={(value) => {
                  setEmailValue(value)
                  setShowValueError(false)
                  setSubmitted(false)
                }}
                required
              />
            ) : null}

            {recoveryOption === 'membershipNumber' ? (
              <div>
                <label htmlFor="membership-number" className="mb-2 block text-sm font-semibold text-slate-700">
                  رقم العضوية
                </label>
                <input
                  id="membership-number"
                  name="membership-number"
                  type="text"
                  required
                  value={membershipNumberValue}
                  onChange={(event) => {
                    setMembershipNumberValue(event.target.value)
                    setShowValueError(false)
                    setSubmitted(false)
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  placeholder="2503017"
                />
              </div>
            ) : null}

            {recoveryOption === 'phoneNumber' ? (
              <PhoneNumberField
                value={phoneNumberValue}
                onChange={(value) => {
                  setPhoneNumberValue(value)
                  setShowValueError(false)
                  setSubmitted(false)
                }}
              />
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