import { Suspense, lazy } from 'react'
import { HomeHeroSection } from './components/HomeHeroSection'

const MembersOverviewCard = lazy(() =>
  import('./components/MembersOverviewCard').then((module) => ({ default: module.MembersOverviewCard })),
)
const GenderDistributionCard = lazy(() =>
  import('./components/GenderDistributionCard').then((module) => ({ default: module.GenderDistributionCard })),
)
const AgeAnalyticsCard = lazy(() =>
  import('./components/AgeAnalyticsCard').then((module) => ({ default: module.AgeAnalyticsCard })),
)

function StatsCardFallback() {
  return <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white/70 shadow-lg" />
}

export function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-sky-100 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center">
        <section className="grid w-full gap-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur md:grid-cols-2 md:p-12">
          <HomeHeroSection />

          <div className="grid gap-4">
            <Suspense fallback={<StatsCardFallback />}>
              <MembersOverviewCard />
            </Suspense>
            <Suspense fallback={<StatsCardFallback />}>
              <GenderDistributionCard />
            </Suspense>
            <Suspense fallback={<StatsCardFallback />}>
              <AgeAnalyticsCard />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  )
}
