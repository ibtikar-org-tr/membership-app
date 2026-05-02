import { useEffect, useMemo, useState } from 'react'
import { fetchEvents, fetchProjects, fetchTasks } from '../../api/vms'
import { useHomeStats } from '../../hooks/useHomeStats'
import { getStoredUser } from '../../utils/auth'

export function DashboardMainPage() {
  const { stats, isLoading: isStatsLoading } = useHomeStats()
  const [projectsCount, setProjectsCount] = useState(0)
  const [eventsCount, setEventsCount] = useState(0)
  const [openTasksCount, setOpenTasksCount] = useState(0)
  const user = useMemo(() => getStoredUser(), [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboardCounts() {
      try {
        const [projectsPayload, eventsPayload, tasksPayload] = await Promise.all([
          fetchProjects(user?.membershipNumber),
          fetchEvents(),
          fetchTasks(user?.membershipNumber ?? ''),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProjectsCount(projectsPayload.projects.length)
        setEventsCount(eventsPayload.events.length)
        setOpenTasksCount(tasksPayload.tasks.filter((task) => task.status === 'open' || task.status === 'in_progress').length)
      } catch {
        // Keep default zeros if dashboard collections fail.
      }
    }

    loadDashboardCounts()

    return () => {
      controller.abort()
    }
  }, [user?.membershipNumber])

  const summaryCards = useMemo(
    () => [
      { label: 'إجمالي الأعضاء', value: (stats?.overview.totalMembers ?? 0).toLocaleString('en-US') },
      { label: 'نشطون على التلغرام', value: (stats?.overview.telegramActive ?? 0).toLocaleString('en-US') },
      { label: 'المشاريع', value: projectsCount.toLocaleString('en-US') },
      { label: 'المهام المفتوحة', value: openTasksCount.toLocaleString('en-US') },
    ],
    [openTasksCount, projectsCount, stats?.overview.telegramActive, stats?.overview.totalMembers],
  )

  const distributionRows = useMemo(
    () => [
      { label: 'الذكور', value: `${stats?.genderDistribution.malePercentage ?? 0}%` },
      { label: 'الإناث', value: `${stats?.genderDistribution.femalePercentage ?? 0}%` },
      { label: 'الدول', value: (stats?.overview.countriesCount ?? 0).toLocaleString('en-US') },
      { label: 'الفعاليات', value: eventsCount.toLocaleString('en-US') },
    ],
    [eventsCount, stats?.genderDistribution.femalePercentage, stats?.genderDistribution.malePercentage, stats?.overview.countriesCount],
  )

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">لوحة الإحصائيات</h2>
            <p className="mt-1 text-sm text-slate-500">بيانات مباشرة من الواجهة الخلفية مع ملخص النشاط الحالي.</p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {isStatsLoading ? 'جار تحديث الإحصائيات...' : 'آخر تحديث: مكتمل'}
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
            {(stats?.ageDistribution ?? []).map((item) => (
              <div key={item.group} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-600">{item.group}</span>
                <span className="text-sm font-semibold text-slate-900">{item.count.toLocaleString('en-US')}</span>
              </div>
            ))}
            {!isStatsLoading && (stats?.ageDistribution.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">لا توجد بيانات توزيع أعمار حالياً.</p>
            ) : null}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">آخر الأخبار</h3>
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-12 px-4">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-lg font-medium text-slate-900">المحتوى فارغ</p>
              <p className="mt-2 text-sm text-slate-600">سيتم إضافة محتوى هذا القسم قريباً. يرجى العودة لاحقاً.</p>
            </div>
          </div>
      </section>
    </div>
  )
}
