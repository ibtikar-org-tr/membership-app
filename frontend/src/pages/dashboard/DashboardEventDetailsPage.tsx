import { Link, Navigate, useParams } from 'react-router-dom'
import { MOCK_EVENTS } from './mockData'

export function DashboardEventDetailsPage() {
  const { eventID } = useParams()
  const eventItem = MOCK_EVENTS.find((item) => item.id === eventID)

  if (!eventID || !eventItem) {
    return <Navigate to="/dashboard/events" replace />
  }

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">تفاصيل الفعالية</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{eventItem.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{eventItem.summary}</p>
          </div>
          <Link
            to="/dashboard/events"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة للفعاليات
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">التاريخ</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{eventItem.date}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">الوقت</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{eventItem.time}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">المكان</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{eventItem.location}</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">معلومات الفعالية</p>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">الجهة المنظمة: {eventItem.host}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">الحضور المتوقع: {eventItem.attendees} عضو</p>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">الوسوم</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {eventItem.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {tag}
            </span>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">جدول الفعالية</p>
        <div className="mt-4 space-y-2">
          {eventItem.agenda.map((agendaItem) => (
            <div key={`${agendaItem.time}-${agendaItem.topic}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{agendaItem.topic}</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                {agendaItem.time}
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}