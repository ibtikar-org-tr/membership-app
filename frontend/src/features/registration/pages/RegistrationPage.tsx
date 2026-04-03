import { Link } from 'react-router-dom'
import { EducationSection } from '../sections/EducationSection'
import { PersonalInfoSection } from '../sections/PersonalInfoSection'
import { ProfileSection } from '../sections/ProfileSection'
import { RegistrationInfoSection } from '../sections/RegistrationInfoSection'
import { useRegistrationForm } from '../hooks/useRegistrationForm'

export function RegistrationPage() {
  const { formData, updateField, handleSubmit } = useRegistrationForm()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-100 px-4 py-8 md:px-6 md:py-10" dir="rtl">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <p className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            #جيلٌ_يبتكر
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">نموذج الانتساب لتجمّع إبتكار</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200 md:text-base">
            تطوير مهارات الطلاب التقنية وتحفيز الابتكار والإبداع. يرجى ملء هذا النموذج لتقديم طلب الانضمام إلى تجمّع إبتكار.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://data.ibtikar.org.tr/documents/ar/intro.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900 border border-white/30"
            >
              📄 الملف التّعريفي
            </a>
            <a
              href="https://github.com/ibtikar-org-tr/bylaws"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900 border border-white/30"
            >
              📋 النظام الداخلي
            </a>
            <Link
              to="/"
              className="inline-block rounded-lg border border-white/50 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900"
            >
              ← العودة إلى الرئيسية
            </Link>
          </div>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <PersonalInfoSection data={formData} onFieldChange={updateField} />
          <EducationSection data={formData} onFieldChange={updateField} />
          <ProfileSection data={formData} onFieldChange={updateField} />
          <RegistrationInfoSection data={formData} onFieldChange={updateField} />

          <div className="rounded-2xl bg-white p-4 shadow-md md:p-6">
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 md:w-auto"
            >
              إرسال التسجيل
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
