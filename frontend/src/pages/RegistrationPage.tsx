import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { useRegistrationForm } from '../hooks/useRegistrationForm'
import type { RegistrationFormData } from '../types/registration'

const PersonalInfoSection = lazy(() =>
  import('../components/registration/sections/PersonalInfoSection').then((module) => ({ default: module.PersonalInfoSection })),
)
const EducationSection = lazy(() =>
  import('../components/registration/sections/EducationSection').then((module) => ({ default: module.EducationSection })),
)
const ProfileSection = lazy(() =>
  import('../components/registration/sections/ProfileSection').then((module) => ({ default: module.ProfileSection })),
)
const RegistrationInfoSection = lazy(() =>
  import('../components/registration/sections/RegistrationInfoSection').then((module) => ({ default: module.RegistrationInfoSection })),
)
const BylawsAcknowledgementSection = lazy(() =>
  import('../components/registration/sections/BylawsAcknowledgementSection').then((module) => ({ default: module.BylawsAcknowledgementSection })),
)

const ALLOWED_SEX_VALUES = new Set(['male', 'female'])

function hasCompletedNonOptionalFields(formData: RegistrationFormData) {
  const hasInterests = formData.interests
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean).length > 0

  return (
    Boolean(formData.email.trim())
    && Boolean(formData.arName.trim())
    && Boolean(formData.enName.trim())
    && ALLOWED_SEX_VALUES.has(formData.sex.trim())
    && Boolean(formData.country.trim())
    && Boolean(formData.region.trim())
    && Boolean(formData.educationLevel.trim())
    && Boolean(formData.school.trim())
    && Boolean(formData.fieldOfStudy.trim())
    && Boolean(formData.graduationYear.trim())
    && hasInterests
  )
}

function SectionLoadingCard() {
  return <div className="h-28 animate-pulse rounded-2xl bg-white/70 shadow-sm" />
}

export function RegistrationPage() {
  const {
    formData,
    isSubmitting,
    submitError,
    submitSuccessMessage,
    hasSubmittedForm,
    isAutosaveEnabled,
    updateField,
    handleSubmit,
    toggleAutosave,
    resetSubmissionStatus,
  } = useRegistrationForm()
  const canShowBylawsAcknowledgementSection = hasCompletedNonOptionalFields(formData)

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-cyan-50 to-emerald-100 px-4 py-8 md:px-6 md:py-10" dir="rtl">
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="https://data.ibtikar.org.tr/documents/ar/intro.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-auto self-start rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
              >
                📄 الملف التّعريفي
              </a>
              <a
                href="https://github.com/ibtikar-org-tr/bylaws"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-auto self-start rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
              >
                📋 النظام الداخلي
              </a>
            </div>
            <Link
              to="/"
              className="inline-flex w-auto self-end rounded-lg border border-white/50 px-3 py-1.5 text-xs font-medium transition hover:bg-white hover:text-slate-900 sm:self-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              ← العودة إلى الرئيسية
            </Link>
          </div>
        </header>

        {hasSubmittedForm ? (
          <section className="rounded-2xl bg-white p-6 shadow-md md:p-8">
            <h2 className="text-2xl font-black text-emerald-700 md:text-3xl">تم استلام طلبك بنجاح</h2>
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 md:text-base">
              {submitSuccessMessage ?? 'تم إرسال طلب التسجيل بنجاح.'}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              يبدو أنك أتممت تعبئة نموذج الانتساب سابقاً. إذا رغبت بتعبئته من جديد، يمكنك استخدام الزر أدناه.
            </p>
            <button
              type="button"
              onClick={resetSubmissionStatus}
              className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              تعبئة النموذج مرة أخرى
            </button>
          </section>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
              الحقول المعلّمة بعلامة <span className="font-bold text-red-600">*</span> مطلوبة.
            </p>
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

            {canShowBylawsAcknowledgementSection ? (
              <Suspense fallback={<SectionLoadingCard />}>
                <BylawsAcknowledgementSection
                  value={formData.bylawsAcknowledgement}
                  onChange={(value) => updateField('bylawsAcknowledgement', value)}
                />
              </Suspense>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                سيظهر قسم إقرار الالتزام بالنظام الداخلي بعد تعبئة جميع الحقول الإلزامية.
              </p>
            )}

            <div className="rounded-2xl bg-white p-4 shadow-md md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-400 md:w-auto hover:cursor-pointer"
                >
                  {isSubmitting ? 'جارٍ إرسال التسجيل...' : 'إرسال التسجيل'}
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

              {submitError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {submitError}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
