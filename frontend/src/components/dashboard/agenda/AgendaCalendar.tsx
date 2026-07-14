import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import arLocale from '@fullcalendar/core/locales/ar'
import { Briefcase, CalendarDays, CheckSquare, X } from 'lucide-react'
import type { AgendaCalendarEvent } from './agenda-utils'
import { groupCalendarEventsByDate, toDateKey } from './agenda-utils'
import { formatDateTimeEnCA, formatTimeEnCA } from '../../../utils/date-format'

function kindLabel(kind: AgendaCalendarEvent['kind']) {
  if (kind === 'task') return 'مهمة'
  if (kind === 'event') return 'فعالية'
  return 'تطوع'
}

function kindIcon(kind: AgendaCalendarEvent['kind']) {
  if (kind === 'task') return CheckSquare
  if (kind === 'event') return CalendarDays
  return Briefcase
}

function formatDayHeading(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

interface AgendaCalendarProps {
  events: AgendaCalendarEvent[]
  unscheduledCount: number
}

export function AgendaCalendar({ events, unscheduledCount }: AgendaCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => toDateKey(new Date()))
  const [visibleRangeLabel, setVisibleRangeLabel] = useState('')

  const eventsByDate = useMemo(() => groupCalendarEventsByDate(events), [events])

  const fullCalendarEvents = useMemo<EventInput[]>(
    () =>
      events.map((eventItem) => ({
        id: eventItem.id,
        title: eventItem.title,
        start: eventItem.start,
        end: eventItem.end,
        allDay: eventItem.allDay,
        backgroundColor: eventItem.backgroundColor,
        borderColor: eventItem.borderColor,
        textColor: eventItem.textColor,
        extendedProps: {
          kind: eventItem.kind,
          href: eventItem.href,
          subtitle: eventItem.subtitle,
        },
      })),
    [events],
  )

  const selectedDayEvents = selectedDateKey ? (eventsByDate.get(selectedDateKey) ?? []) : []

  const handleDatesSet = (info: DatesSetArg) => {
    const formatter = new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' })
    setVisibleRangeLabel(formatter.format(info.view.currentStart))
  }

  const handleDateClick = (dateKey: string) => {
    setSelectedDateKey(dateKey)
  }

  const handleEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault()
    const start = info.event.start
    if (start) {
      setSelectedDateKey(toDateKey(start))
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-medium text-violet-800">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            مهام
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-medium text-cyan-800">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            فعاليات
          </span>
        </div>

        {unscheduledCount > 0 ? (
          <span className="text-xs text-slate-500">{unscheduledCount} مهمة بدون موعد نهائي</span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="agenda-calendar [&_.fc]:font-[inherit] [&_.fc-toolbar-title]:text-lg [&_.fc-toolbar-title]:font-semibold [&_.fc-toolbar-title]:text-slate-900 [&_.fc-button]:rounded-lg [&_.fc-button]:border-slate-200 [&_.fc-button]:bg-white [&_.fc-button]:px-3 [&_.fc-button]:py-1.5 [&_.fc-button]:text-sm [&_.fc-button]:font-medium [&_.fc-button]:text-slate-700 [&_.fc-button]:shadow-sm [&_.fc-button:hover]:border-slate-300 [&_.fc-button:hover]:bg-slate-50 [&_.fc-button-primary:not(:disabled).fc-button-active]:border-indigo-300 [&_.fc-button-primary:not(:disabled).fc-button-active]:bg-indigo-50 [&_.fc-button-primary:not(:disabled).fc-button-active]:text-indigo-700 [&_.fc-col-header-cell-cushion]:py-2 [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:text-slate-600 [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:font-medium [&_.fc-daygrid-day-number]:text-slate-600 [&_.fc-daygrid-day.fc-day-today]:bg-indigo-50/60 [&_.fc-daygrid-day.fc-day-selected]:bg-indigo-100/70 [&_.fc-daygrid-event]:rounded-md [&_.fc-daygrid-event]:border [&_.fc-daygrid-event]:px-1.5 [&_.fc-daygrid-event]:py-0.5 [&_.fc-daygrid-event]:text-[11px] [&_.fc-daygrid-event]:font-semibold [&_.fc-daygrid-day-frame]:min-h-26 [&_.fc-scrollgrid]:border-slate-200 [&_.fc-theme-standard td]:border-slate-100 [&_.fc-theme-standard th]:border-slate-100">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={arLocale}
            direction="rtl"
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={3}
            moreLinkClick="day"
            events={fullCalendarEvents}
            headerToolbar={{
              start: 'prev,next today',
              center: 'title',
              end: '',
            }}
            buttonText={{
              today: 'اليوم',
            }}
            datesSet={handleDatesSet}
            dateClick={(info) => handleDateClick(toDateKey(info.date))}
            eventClick={handleEventClick}
            dayCellClassNames={(info) => {
              const dateKey = toDateKey(info.date)
              return selectedDateKey === dateKey ? ['fc-day-selected'] : []
            }}
          />
        </div>
      </div>

      {visibleRangeLabel ? (
        <p className="text-center text-xs text-slate-500">عرض شهر {visibleRangeLabel}</p>
      ) : null}

      {selectedDateKey ? (
        <aside className="rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-indigo-700">تفاصيل اليوم</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{formatDayHeading(selectedDateKey)}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {selectedDayEvents.length > 0
                  ? `${selectedDayEvents.length} عنصر في هذا اليوم`
                  : 'لا توجد عناصر في هذا اليوم'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDateKey(null)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="mt-4 space-y-2">
              {selectedDayEvents.map((eventItem) => {
                const Icon = kindIcon(eventItem.kind)

                return (
                  <Link
                    key={`${selectedDateKey}-${eventItem.id}`}
                    to={eventItem.href}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-200 hover:shadow-sm"
                    style={{ borderRightWidth: 3, borderRightColor: eventItem.borderColor }}
                  >
                    <span
                      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: eventItem.backgroundColor, color: eventItem.textColor }}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{eventItem.title}</p>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {kindLabel(eventItem.kind)}
                        </span>
                      </div>
                      {eventItem.subtitle ? (
                        <p className="mt-1 truncate text-xs text-slate-500">{eventItem.subtitle}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-600">
                        {eventItem.allDay
                          ? 'طوال اليوم'
                          : `${formatDateTimeEnCA(eventItem.start)}${eventItem.end ? ` – ${formatTimeEnCA(eventItem.end)}` : ''}`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center">
              <p className="text-sm text-slate-500">لا مهام أو فعاليات مجدولة في هذا اليوم.</p>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  )
}
