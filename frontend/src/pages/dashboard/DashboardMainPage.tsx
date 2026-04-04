import { AgeAnalyticsCard } from '../../components/main-page/AgeAnalyticsCard'
import { GenderDistributionCard } from '../../components/main-page/GenderDistributionCard'
import { MembersOverviewCard } from '../../components/main-page/MembersOverviewCard'
import { MOCK_NEWS, MOCK_STATS } from './mockData'

export function DashboardMainPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-black text-slate-900 sm:text-xl">لوحة الإحصائيات</h2>
        <p className="mt-1 text-sm text-slate-500">بيانات تجريبية لعرض تصميم الصفحة حتى يتم ربطها بالواجهة الخلفية.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MembersOverviewCard overview={MOCK_STATS.overview} />
        <GenderDistributionCard genderDistribution={MOCK_STATS.genderDistribution} />
      </section>

      <section>
        <AgeAnalyticsCard ageDistribution={MOCK_STATS.ageDistribution} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-base font-black text-slate-900 sm:text-lg">آخر الأخبار</h3>
        <div className="mt-4 space-y-3">
          {MOCK_NEWS.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-slate-800">{item.title}</p>
                <span className="text-xs font-medium text-slate-500">{item.date}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}