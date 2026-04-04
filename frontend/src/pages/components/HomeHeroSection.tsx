import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'

const VolunteersStatsCard = lazy(() =>
  import('./VolunteersStatsCard').then((module) => ({ default: module.VolunteersStatsCard })),
)

function VolunteersCardFallback() {
  return <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white/70 shadow-lg" />
}

export function HomeHeroSection() {
  return (
    <div className="space-y-6">
      <p className="inline-block rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-700">
        #جيلٌ_يبتكر
      </p>
      <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
        منصّة أعضاء تجمّع إبتكار
      </h1>
      <Link
        to="/registration"
        className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
      >
        نموذج الانتساب لتجمّع إبتكار
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/login"
          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400"
        >
          تسجيل الدخول
        </Link>
        <Link
          to="/iforgot"
          className="inline-flex items-center rounded-xl px-1 py-3 text-base font-semibold text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline"
        >
          نسيت معلوماتي
        </Link>
      </div>
      <Suspense fallback={<VolunteersCardFallback />}>
        <VolunteersStatsCard />
      </Suspense>
    </div>
  )
}