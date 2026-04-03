import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { useRegistrationForm } from '../hooks/useRegistrationForm'

const PersonalInfoSection = lazy(() =>
  import('../sections/PersonalInfoSection').then((module) => ({ default: module.PersonalInfoSection })),
)
const EducationSection = lazy(() =>
  import('../sections/EducationSection').then((module) => ({ default: module.EducationSection })),
)
const ProfileSection = lazy(() =>
  import('../sections/ProfileSection').then((module) => ({ default: module.ProfileSection })),
)
const RegistrationInfoSection = lazy(() =>
  import('../sections/RegistrationInfoSection').then((module) => ({ default: module.RegistrationInfoSection })),
)

function SectionLoadingCard() {
  return <div className="h-28 animate-pulse rounded-2xl bg-white/70 shadow-sm" />
}

export function RegistrationPage() {
  const { formData, isAutosaveEnabled, updateField, handleSubmit, toggleAutosave } = useRegistrationForm()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-100 px-4 py-8 md:px-6 md:py-10" dir="rtl">
      <div className="mx-auto w-full max-w-5xl">
        <header className="relative mb-6 rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <img
            src="/white_long_logo.svg"
            alt="IBTIKAR"
            className="pointer-events-none absolute left-6 top-6 h-8 w-auto opacity-95 md:h-20"
          />
          <p className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            #جيلٌ_يبتكر
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">نموذج الانتساب لتجمّع إبتكار</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200 md:text-base">
            تطوير مهارات الطلاب التقنية وتحفيز الابتكار والإبداع. يرجى ملء هذا النموذج لتقديم طلب الانضمام إلى تجمّع إبتكار.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <a
                href="https://data.ibtikar.org.tr/documents/ar/intro.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900"
              >
                📄 الملف التّعريفي
              </a>
              <a
                href="https://github.com/ibtikar-org-tr/bylaws"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900"
              >
                📋 النظام الداخلي
              </a>
            </div>
            <Link
              to="/"
              className="inline-block rounded-lg border border-white/50 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900"
            >
              ← العودة إلى الرئيسية
            </Link>
          </div>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Suspense fallback={<SectionLoadingCard />}>
            <PersonalInfoSection data={formData} onFieldChange={updateField} />
          </Suspense>
          <Suspense fallback={<SectionLoadingCard />}>
            <EducationSection data={formData} onFieldChange={updateField} />
          </Suspense>
          <Suspense fallback={<SectionLoadingCard />}>
            <ProfileSection data={formData} onFieldChange={updateField} />
          </Suspense>
          <Suspense fallback={<SectionLoadingCard />}>
            <RegistrationInfoSection data={formData} onFieldChange={updateField} />
          </Suspense>

          <div className="rounded-2xl bg-white p-4 shadow-md md:p-6">
            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 md:w-auto"
              >
                إرسال التسجيل
              </button>

              <div className="flex w-full flex-col items-start gap-2 md:w-auto md:items-end">
                <p className="text-sm font-semibold text-slate-800 md:text-right">حفظ الجلسة</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAutosaveEnabled}
                  onClick={toggleAutosave}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    isAutosaveEnabled ? 'bg-sky-500' : 'bg-slate-300'
                  }`}
                >
                  <span className="sr-only">تفعيل حفظ النموذج محلياً</span>
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      isAutosaveEnabled ? '-translate-x-1' : '-translate-x-6'
                    }`}
                  />
                </button>
                {isAutosaveEnabled ? (
                  <p className="max-w-xs text-xs leading-relaxed text-slate-500 md:text-right">يتم حفظ التقدم تلقائياً في المتصفح.</p>
                ) : (
                  <p className="max-w-xs text-xs leading-relaxed text-slate-400 md:text-right">
                    عند تفعيل هذا الخيار، سيتم حفظ تقدمك في المتصفح تلقائياً لمنع فقدان البيانات عند تحديث الصفحة أو إغلاقها.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
