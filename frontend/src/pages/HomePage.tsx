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
const YourMessagesFloating = lazy(() =>
  import('./components/YourMessagesFloating').then((module) => ({ default: module.YourMessagesFloating })),
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
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [sectionHeight, setSectionHeight] = useState<number | null>(null)

  useEffect(() => {
    const sectionElement = sectionRef.current
    const contentElement = contentRef.current
    if (!sectionElement || !contentElement) {
      return
    }

    const updateHeight = () => {
      setSectionHeight(contentElement.scrollHeight)
    }

    updateHeight()
    const t1 = window.setTimeout(updateHeight, 50)
    const t2 = window.setTimeout(updateHeight, 250)
    const t3 = window.setTimeout(updateHeight, 800)

    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })

    resizeObserver.observe(contentElement)
    window.addEventListener('resize', updateHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeight)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [])

  return (
    <main className="min-h-screen overflow-x-clip bg-linear-to-br from-amber-50 via-teal-50 to-sky-100 px-3 py-6 text-slate-800 sm:px-4 sm:py-8 md:px-6 md:py-10" dir="rtl">
      <div className="relative mx-auto flex min-h-[80vh] w-full max-w-6xl items-start md:items-center">
        <Suspense fallback={null}>
          <YourMessagesFloating />
        </Suspense>
        <section
          ref={sectionRef}
          className="relative z-10 w-full overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-2xl backdrop-blur transition-[height] duration-1000 ease-out sm:rounded-3xl"
          style={sectionHeight === null ? undefined : { height: `${sectionHeight}px` }}
        >
          <div ref={contentRef} className="grid gap-5 p-4 sm:gap-6 sm:p-6 md:grid-cols-2 md:gap-8 md:p-12">
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
          </div>
        </section>
      </div>
    </main>
  )
}
