import { Link } from 'react-router-dom'
import { EducationSection } from '../sections/EducationSection'
import { PersonalInfoSection } from '../sections/PersonalInfoSection'
import { ProfileSection } from '../sections/ProfileSection'
import { RegistrationInfoSection } from '../sections/RegistrationInfoSection'
import { useRegistrationForm } from '../hooks/useRegistrationForm'

export function RegistrationPage() {
  const { formData, updateField, handleSubmit } = useRegistrationForm()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-100 px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl bg-slate-900 p-6 text-white shadow-xl md:p-8">
          <p className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            app.com/registration
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Membership Registration Form</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200 md:text-base">
            This frontend form is based on your SQL schema and includes account, profile, education,
            and community registration details.
          </p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg border border-white/50 px-4 py-2 text-sm font-medium transition hover:bg-white hover:text-slate-900"
          >
            Back to Home
          </Link>
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
              Submit Registration (Frontend Only)
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
