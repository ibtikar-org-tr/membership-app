import { Link } from 'react-router-dom'
import { MOCK_EVENTS } from './mockData'

export function DashboardEventsPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الفعاليات</h2>
          <p className="mt-1 text-sm text-slate-500">جدول الفعاليات القادمة داخل المجتمع.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {MOCK_EVENTS.length} فعاليات هذا الشهر
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {MOCK_EVENTS.map((eventItem) => (
          <article key={eventItem.title} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">{eventItem.title}</p>
              <Link
                to={`/dashboard/events/${eventItem.id}`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                عرض الفعالية
              </Link>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
              <p>التاريخ: {eventItem.date}</p>
              <p>الوقت: {eventItem.time}</p>
              <p>المكان: {eventItem.location}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}