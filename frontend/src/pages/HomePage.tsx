import { AgeAnalyticsCard } from './components/AgeAnalyticsCard'
import { GenderDistributionCard } from './components/GenderDistributionCard'
import { HomeHeroSection } from './components/HomeHeroSection'
import { MembersOverviewCard } from './components/MembersOverviewCard'

export function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-sky-100 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center">
        <section className="grid w-full gap-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur md:grid-cols-2 md:p-12">
          <HomeHeroSection />

          <div className="grid gap-4">
            <MembersOverviewCard />
            <GenderDistributionCard />

            <AgeAnalyticsCard />
          </div>
        </section>
      </div>
    </main>
  )
}
