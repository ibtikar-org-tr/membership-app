import { Link } from 'react-router-dom'
import type { VmsEvent } from '../../../types/vms'
import { formatDateEnCA } from '../../../utils/date-format'

function eventStatusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

export function EventCard({ eventItem }: { eventItem: VmsEvent }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
      {eventItem.imageUrl ? (
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={eventItem.imageUrl}
            alt={eventItem.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-linear-to-br from-cyan-50 to-slate-100">
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
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {eventStatusLabel(eventItem.status)}
          </span>
          {eventItem.country ? (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700">
              {eventItem.country}
            </span>
          ) : null}
          {eventItem.region ? (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
              {eventItem.region}
            </span>
          ) : null}
        </div>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900">{eventItem.name}</h3>
        {eventItem.description ? (
          <p className="mb-3 line-clamp-2 text-xs text-slate-600">{eventItem.description}</p>
        ) : null}
        <div className="space-y-1.5 text-xs text-slate-600">
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
            {formatDateEnCA(eventItem.startTime)}
          </span>
        </div>
        <Link
          to={`/dashboard/event/${eventItem.id}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
        >
          عرض التفاصيل
        </Link>
      </div>
    </article>
  )
}
