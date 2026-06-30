import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import type { VmsEvent } from '../../../types/vms'
import { formatDateEnCA } from '../../../utils/date-format'

function eventStatusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

function eventStatusTone(status: string) {
  if (status === 'public') return 'border-emerald-200/80 bg-emerald-500/90 text-white'
  if (status === 'archived') return 'border-slate-200/80 bg-slate-600/90 text-white'
  return 'border-amber-200/80 bg-amber-500/90 text-white'
}

export function EventCard({ eventItem }: { eventItem: VmsEvent }) {
  const locationLabel = [eventItem.region, eventItem.country].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/event/${eventItem.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/1] overflow-hidden bg-linear-to-br from-cyan-50 to-slate-100">
        {eventItem.imageUrl ? (
          <img
            src={eventItem.imageUrl}
            alt={eventItem.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="h-10 w-10 text-slate-300 sm:h-12 sm:w-12" strokeWidth={1.25} />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/35 to-slate-950/5" />

        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm sm:text-[11px] ${eventStatusTone(eventItem.status)}`}
            >
              {eventStatusLabel(eventItem.status)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm sm:text-[11px]">
              <CalendarDays className="h-3 w-3 shrink-0" />
              {formatDateEnCA(eventItem.startTime)}
            </span>
          </div>

          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">{eventItem.name}</h3>

          {locationLabel ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/85 sm:text-xs">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-100 px-3 py-2.5 sm:px-4">
        <p
          className={`line-clamp-2 text-xs leading-relaxed sm:text-sm ${
            eventItem.description ? 'text-slate-600' : 'text-slate-400 italic'
          }`}
        >
          {eventItem.description?.trim() || 'لا يوجد وصف متاح للفعالية.'}
        </p>
      </div>
    </Link>
  )
}
