import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../api/vms'
import type { VmsEvent } from '../../types/vms'

export function DashboardEventsPage() {
  const [events, setEvents] = useState<VmsEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadEvents() {
      try {
        const payload = await fetchEvents()

        if (!controller.signal.aborted) {
          setEvents(payload.events)
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

    loadEvents()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الفعاليات</h2>
          <p className="mt-1 text-sm text-slate-500">جدول الفعاليات القادمة داخل المجتمع.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {events.length} فعالية
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? <p className="text-sm text-slate-500">جار تحميل الفعاليات...</p> : null}
        {!isLoading && hasError ? <p className="text-sm text-red-600">تعذر تحميل الفعاليات.</p> : null}
        {!isLoading && !hasError && events.length === 0 ? <p className="text-sm text-slate-500">لا توجد فعاليات حالياً.</p> : null}

        {!isLoading &&
          !hasError &&
          events.map((eventItem) => (
          <article key={eventItem.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">{eventItem.name}</p>
              <Link
                to={`/dashboard/events/${eventItem.id}`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                عرض الفعالية
              </Link>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <p>البداية: {new Date(eventItem.startTime).toLocaleString('ar-EG')}</p>
              <p>النهاية: {new Date(eventItem.endTime).toLocaleString('ar-EG')}</p>
              <p>المكان: {eventItem.location ?? 'غير محدد'}</p>
            </div>
          </article>
          ))}
      </div>
    </section>
  )
}