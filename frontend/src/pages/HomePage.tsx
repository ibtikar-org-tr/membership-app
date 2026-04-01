import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-sky-100 px-6 py-10 text-slate-800">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center">
        <section className="grid w-full gap-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur md:grid-cols-2 md:p-12">
          <div className="space-y-6">
            <p className="inline-block rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-700">
              Ibtikar Assembly
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
              Membership Portal for a Stronger Community
            </h1>
            <p className="text-lg leading-relaxed text-slate-600">
              Join the network, share your story, and help us build impactful initiatives together.
            </p>
            <Link
              to="/registration"
              className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              Open Registration Form
            </Link>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white shadow-lg">
              <h2 className="text-lg font-bold">Personal Profile</h2>
              <p className="mt-1 text-sm text-teal-50">Basic details, contact, and biography</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white shadow-lg">
              <h2 className="text-lg font-bold">Education & Skills</h2>
              <p className="mt-1 text-sm text-amber-50">Academic background and expertise</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 p-5 text-white shadow-lg">
              <h2 className="text-lg font-bold">Community Journey</h2>
              <p className="mt-1 text-sm text-sky-50">How you heard about us and your motivation</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
