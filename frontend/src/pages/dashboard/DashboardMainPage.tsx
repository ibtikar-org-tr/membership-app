import { MOCK_NEWS, MOCK_STATS } from './mockData'

export function DashboardMainPage() {
  const summaryCards = [
    { label: 'إجمالي الأعضاء', value: MOCK_STATS.overview.totalMembers.toLocaleString('en-US') },
    { label: 'نشطون على التلغرام', value: MOCK_STATS.overview.telegramActive.toLocaleString('en-US') },
    { label: 'منتسبون جدد', value: MOCK_STATS.overview.newMembers.toLocaleString('en-US') },
    { label: 'الجامعات', value: MOCK_STATS.overview.universitiesCount.toLocaleString('en-US') },
  ]

  const distributionRows = [
    { label: 'الذكور', value: `${MOCK_STATS.genderDistribution.malePercentage}%` },
    { label: 'الإناث', value: `${MOCK_STATS.genderDistribution.femalePercentage}%` },
    { label: 'الدول', value: MOCK_STATS.overview.countriesCount.toLocaleString('en-US') },
    { label: 'نمو الدورة', value: `+${MOCK_STATS.overview.cycleGrowthPercentage}%` },
  ]

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">لوحة الإحصائيات</h2>
            <p className="mt-1 text-sm text-slate-500">بيانات تجريبية لعرض تصميم الصفحة حتى يتم ربطها بالواجهة الخلفية.</p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            آخر تحديث: اليوم 10:30
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">ملخص التوزيع</h3>
          <div className="mt-4 space-y-2">
            {distributionRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">توزيع الأعمار</h3>
          <div className="mt-4 space-y-2">
            {MOCK_STATS.ageDistribution.map((item) => (
              <div key={item.group} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">{item.group}</span>
                <span className="text-sm font-semibold text-slate-900">{item.count.toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">آخر الأخبار</h3>
        <div className="mt-4 space-y-3">
          {MOCK_NEWS.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {item.date}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}