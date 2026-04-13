import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchEvents } from '../../api/vms'
import type { VmsEvent } from '../../types/vms'
import { formatDateTimeEnCA } from '../../utils/date-format'

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
          <p className="mt-1 text-xs text-slate-500">إضافة الفعاليات تتم من صفحة المشروع بواسطة مالك المشروع أو مديريه.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {events.length} فعالية
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <p className="col-span-full text-center text-sm text-slate-500">جار تحميل الفعاليات...</p> : null}
        {!isLoading && hasError ? <p className="col-span-full text-center text-sm text-red-600">تعذر تحميل الفعاليات.</p> : null}
        {!isLoading && !hasError && events.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-500">لا توجد فعاليات حالياً.</p>
        ) : null}

        {!isLoading &&
          !hasError &&
          events.map((eventItem) => (
            <article
              key={eventItem.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              {eventItem.imageUrl ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={eventItem.imageUrl}
                    alt={eventItem.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100">
                  <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900 line-clamp-2">{eventItem.name}</h3>
                {eventItem.description ? (
                  <p className="mb-3 text-xs text-slate-600 line-clamp-2">{eventItem.description}</p>
                ) : null}
                <div className="space-y-1.5 text-xs text-slate-600">
                  {eventItem.startTime && (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>البداية: {formatDateTimeEnCA(eventItem.startTime)}</span>
                    </div>
                  )}
                  {eventItem.endTime && (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>النهاية: {formatDateTimeEnCA(eventItem.endTime)}</span>
                    </div>
                  )}
                  {eventItem.location && (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{eventItem.location}</span>
                    </div>
                  )}
                </div>
                <Link
                  to={`/dashboard/event/${eventItem.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  عرض التفاصيل
                  <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
      </div>
    </section>
  )
}