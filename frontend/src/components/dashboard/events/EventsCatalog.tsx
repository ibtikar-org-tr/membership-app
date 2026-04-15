import { useMemo, useState } from 'react'
import type { VmsEvent } from '../../../types/vms'
import { EventCard } from './EventCard'

type TimeFilter = 'all' | 'upcoming' | 'finished'
type StatusFilter = 'all' | 'draft' | 'public' | 'archived'

function isFinished(eventItem: VmsEvent, now: Date) {
  if (!eventItem.endTime) return false
  const endTime = new Date(eventItem.endTime)
  return endTime < now
}

function eventMatchesStatus(eventItem: VmsEvent, status: StatusFilter) {
  if (status === 'all') return true
  return eventItem.status === status
}

export function EventsCatalog({
  events,
  emptyMessage,
}: {
  events: VmsEvent[]
  emptyMessage: string
}) {
  const [query, setQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const now = new Date()
  const normalizedQuery = query.trim().toLowerCase()

  const statusOptions = useMemo(() => {
    const statuses = new Set(events.map((eventItem) => eventItem.status))
    const options: Array<{ value: StatusFilter; label: string }> = [{ value: 'all', label: 'كل الحالات' }]
    if (statuses.has('draft')) options.push({ value: 'draft', label: 'مسودة' })
    if (statuses.has('public')) options.push({ value: 'public', label: 'منشورة' })
    if (statuses.has('archived')) options.push({ value: 'archived', label: 'مؤرشفة' })
    return options
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      if (!eventMatchesStatus(eventItem, statusFilter)) {
        return false
      }

      const finished = isFinished(eventItem, now)
      if (timeFilter === 'upcoming' && finished) return false
      if (timeFilter === 'finished' && !finished) return false

      if (!normalizedQuery) return true
      return (
        eventItem.name.toLowerCase().includes(normalizedQuery) ||
        (eventItem.description ?? '').toLowerCase().includes(normalizedQuery)
      )
    })
  }, [events, statusFilter, timeFilter, normalizedQuery, now])

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث باسم الفعالية أو الوصف"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
        />
        <select
          value={timeFilter}
          onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
        >
          <option value="all">كل الأوقات</option>
          <option value="upcoming">القادمة والقائمة</option>
          <option value="finished">المنتهية</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((eventItem) => (
            <EventCard key={eventItem.id} eventItem={eventItem} />
          ))}
        </div>
      )}
    </div>
  )
}
