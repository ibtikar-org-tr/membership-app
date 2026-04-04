import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { LazyReveal } from './LazyReveal'

const VolunteersStatsCard = lazy(() =>
  import('./VolunteersStatsCard').then((module) => ({ default: module.VolunteersStatsCard })),
)

function VolunteersCardFallback() {
  return (
    <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-lg">
      <div className="h-4 w-24 rounded bg-slate-200/80" />
      <div className="mt-4 h-8 w-32 rounded bg-slate-200/70" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-14 rounded bg-slate-200/70" />
        <div className="h-14 rounded bg-slate-200/70" />
        <div className="h-14 rounded bg-slate-200/70" />
      </div>
    </div>
  )
}

export function HomeHeroSection() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <p className="inline-block rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-700">
        #جيلٌ_يبتكر
      </p>
      <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
        منصّة أعضاء تجمّع إبتكار
      </h1>
      <Link
        to="/registration"
        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 sm:w-auto"
      >
        نموذج الانتساب لتجمّع إبتكار
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 sm:w-auto"
        >
          تسجيل الدخول
        </Link>
        <Link
          to="/iforgot"
          className="inline-flex w-full items-center justify-center rounded-xl px-1 py-3 text-base font-semibold text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline sm:w-auto"
        >
          نسيت معلوماتي
        </Link>
      </div>
      <Suspense fallback={<VolunteersCardFallback />}>
        <LazyReveal delayMs={120}>
          <VolunteersStatsCard />
        </LazyReveal>
      </Suspense>
    </div>
  )
}