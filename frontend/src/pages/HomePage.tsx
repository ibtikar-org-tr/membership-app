import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { HomeHeroSection } from './components/HomeHeroSection'
import { LazyReveal } from './components/LazyReveal'

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
  return (
    <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-lg">
      <div className="h-4 w-28 rounded bg-slate-200/80" />
      <div className="mt-4 h-8 w-40 rounded bg-slate-200/70" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-12 rounded bg-slate-200/70" />
        <div className="h-12 rounded bg-slate-200/70" />
      </div>
    </div>
  )
}

export function HomePage() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [sectionHeight, setSectionHeight] = useState<number | null>(null)

  useEffect(() => {
    const sectionElement = sectionRef.current
    if (!sectionElement) {
      return
    }

    const updateHeight = () => {
      setSectionHeight(sectionElement.scrollHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })

    resizeObserver.observe(sectionElement)
    window.addEventListener('resize', updateHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-sky-100 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center">
        <section
          ref={sectionRef}
          className="grid w-full gap-8 overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur transition-[height] duration-1000 ease-out md:grid-cols-2 md:p-12"
          style={sectionHeight === null ? undefined : { height: `${sectionHeight}px` }}
        >
          <HomeHeroSection />

          <div className="grid gap-4">
            <Suspense fallback={<StatsCardFallback />}>
              <LazyReveal delayMs={0}>
                <MembersOverviewCard />
              </LazyReveal>
            </Suspense>
            <Suspense fallback={<StatsCardFallback />}>
              <LazyReveal delayMs={90}>
                <GenderDistributionCard />
              </LazyReveal>
            </Suspense>
            <Suspense fallback={<StatsCardFallback />}>
              <LazyReveal delayMs={170}>
                <AgeAnalyticsCard />
              </LazyReveal>
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  )
}
