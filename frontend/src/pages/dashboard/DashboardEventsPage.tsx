import { useEffect, useMemo, useState } from 'react'
import { fetchEvents } from '../../api/vms'
import type { VmsEvent } from '../../types/vms'
import { EventsCatalog } from '../../components/dashboard/events/EventsCatalog'

export function DashboardEventsPage() {
  const [events, setEvents] = useState<VmsEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const publicEvents = useMemo(() => events.filter((eventItem) => eventItem.status === 'public'), [events])

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
          <p className="mt-1 text-sm text-slate-500">الفعاليات المنشورة داخل المجتمع.</p>
          <p className="mt-1 text-xs text-slate-500">إضافة الفعاليات تتم من صفحة المشروع بواسطة مالك المشروع أو مديريه.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {publicEvents.length} فعالية منشورة
        </span>
      </div>

      {isLoading ? <p className="mt-6 text-center text-sm text-slate-500">جار تحميل الفعاليات...</p> : null}
      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل الفعاليات.</p> : null}
      {!isLoading && !hasError ? <EventsCatalog events={publicEvents} emptyMessage="لا توجد فعاليات منشورة حالياً." /> : null}
    </section>
  )
}