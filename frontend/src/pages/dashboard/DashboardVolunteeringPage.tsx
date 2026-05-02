import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOpenPositions } from '../../api/vms'
import type { VmsPosition } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

export function DashboardVolunteeringPage() {
  const user = useMemo(() => getStoredUser(), [])
  const [positions, setPositions] = useState<VmsPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPositions() {
      try {
        const payload = await fetchOpenPositions(user?.membershipNumber ?? '')

        if (!controller.signal.aborted) {
          setPositions(payload.positions)
          setHasError(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadPositions()

    return () => {
      controller.abort()
    }
  }, [user?.membershipNumber])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">التطوع</h2>
          <p className="mt-1 text-sm text-slate-500">الفرص التطوعية المفتوحة عبر جميع المشاريع.</p>
          <p className="mt-1 text-xs text-slate-500">استعرض الفرص المتاحة ثم انتقل إلى مشروع الفرصة لمزيد من التفاصيل.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {positions.length} فرصة مفتوحة
        </span>
      </div>

      {isLoading ? <p className="mt-6 text-center text-sm text-slate-500">جار تحميل الفرص التطوعية...</p> : null}
      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل الفرص التطوعية.</p> : null}

      {!isLoading && !hasError ? (
        positions.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">لا توجد فرص تطوعية مفتوحة حالياً.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {positions.map((position) => (
              <article key={position.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{position.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">المشروع: {position.projectName ?? position.projectId}</p>
                  </div>
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                    مفتوحة
                  </span>
                </div>

                {position.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{position.description}</p> : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{position.seats} مقاعد</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{position.acceptedApplicationsCount} مقبولين</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{position.applications.length} طلب</span>
                </div>

                <div className="mt-4 text-left">
                  <Link
                    to={`/dashboard/projects/${position.projectId}/positions`}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    عرض مشروع الفرصة
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  )
}
