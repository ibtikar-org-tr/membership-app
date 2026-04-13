import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { fetchEventById, fetchEventRegistrations, fetchEventTickets } from '../../api/vms'
import type { VmsEvent, VmsEventRegistration, VmsEventTicket } from '../../types/vms'

function registrationStatusLabel(status: string) {
  if (status === 'registered') {
    return 'مسجل'
  }

  if (status === 'attended') {
    return 'حضر'
  }

  if (status === 'cancelled') {
    return 'ملغي'
  }

  if (status === 'no_show') {
    return 'لم يحضر'
  }

  return status
}

export function DashboardEventDetailsPage() {
  const { eventID } = useParams()
  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [tickets, setTickets] = useState<VmsEventTicket[]>([])
  const [registrations, setRegistrations] = useState<VmsEventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!eventID) {
      return
    }

    const currentEventId = eventID

    const controller = new AbortController()

    async function loadEventDetails() {
      try {
        const [eventPayload, ticketsPayload, registrationsPayload] = await Promise.all([
          fetchEventById(currentEventId),
          fetchEventTickets(currentEventId),
          fetchEventRegistrations(currentEventId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setEventItem(eventPayload.event)
        setTickets(ticketsPayload.eventTickets)
        setRegistrations(registrationsPayload.eventRegistrations)
      } catch {
        if (!controller.signal.aborted) {
          setNotFound(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadEventDetails()

    return () => {
      controller.abort()
    }
  }, [eventID])

  const totalTicketCapacity = useMemo(() => tickets.reduce((sum, ticket) => sum + ticket.quantity, 0), [tickets])

  if (!eventID || notFound) {
    return <Navigate to="/dashboard/events" replace />
  }

  if (isLoading || !eventItem) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل الفعالية...</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">تفاصيل الفعالية</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{eventItem.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{eventItem.description ?? 'لا يوجد وصف متاح للفعالية.'}</p>
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
          <p className="text-xs text-slate-500">البداية</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(eventItem.startTime).toLocaleString('ar-EG')}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">النهاية</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(eventItem.endTime).toLocaleString('ar-EG')}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">المكان</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{eventItem.location ?? 'غير محدد'}</p>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">معلومات الفعالية</p>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">المنشئ: {eventItem.createdBy}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">سعة التذاكر: {totalTicketCapacity} مقعد</p>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">المهارات المطلوبة أو المقترحة</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(eventItem.skills ?? {}).length === 0 ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">لا توجد مهارات مرتبطة</span>
          ) : null}
          {Object.entries(eventItem.skills ?? {}).map(([skillName, skillType]) => (
            <span key={skillName} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {skillName} ({skillType})
            </span>
          ))}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">التذاكر والتسجيلات</p>
        <div className="mt-4 space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-semibold text-slate-700">{ticket.name}</p>
              <p className="mt-1 text-xs text-slate-600">
                العدد: {ticket.quantity} • النقاط: {ticket.pointPrice} • السعر: {ticket.currencyPrice}
              </p>
            </div>
          ))}
          {registrations.map((registration) => (
            <div key={registration.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-700">{registration.membershipNumber}</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                {registrationStatusLabel(registration.status)}
              </span>
            </div>
          ))}
          {tickets.length === 0 && registrations.length === 0 ? <p className="text-sm text-slate-500">لا توجد بيانات تذاكر أو تسجيلات لهذه الفعالية.</p> : null}
        </div>
      </article>
    </section>
  )
}