import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CheckCircle, Clock, Trash2, Users } from 'lucide-react'
import {
  approveRegistration,
  deleteEventRegistration,
  fetchEventById,
  fetchEventRegistrations,
  fetchEventTickets,
  fetchProjectMembers,
  updateEventRegistration,
} from '../../api/vms'
import type { VmsEvent, VmsEventRegistration, VmsEventTicket, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

function registrationStatusLabel(status: string) {
  if (status === 'registered') return 'مسجل'
  if (status === 'attended') return 'حضر'
  if (status === 'cancelled') return 'ملغي'
  if (status === 'no_show') return 'لم يحضر'
  return status
}

export function DashboardEventAdminPage() {
  const { eventID } = useParams()
  const user = useMemo(() => getStoredUser(), [])

  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [tickets, setTickets] = useState<VmsEventTicket[]>([])
  const [registrations, setRegistrations] = useState<VmsEventRegistration[]>([])
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busyRegistrationId, setBusyRegistrationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!eventID) return
    const controller = new AbortController()
    async function load() {
      try {
        const [eventPayload, ticketsPayload, registrationsPayload] = await Promise.all([
          fetchEventById(eventID),
          fetchEventTickets(eventID),
          fetchEventRegistrations(eventID),
        ])
        if (controller.signal.aborted) return
        setEventItem(eventPayload.event)
        setTickets(ticketsPayload.eventTickets)
        setRegistrations(registrationsPayload.eventRegistrations)
      } catch {
        if (!controller.signal.aborted) setNotFound(true)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [eventID])

  useEffect(() => {
    if (!eventItem?.projectId) {
      setProjectMembers([])
      return
    }
    const controller = new AbortController()
    async function loadMembers() {
      try {
        const payload = await fetchProjectMembers(eventItem.projectId as string)
        if (!controller.signal.aborted) setProjectMembers(payload.projectMembers)
      } catch {
        if (!controller.signal.aborted) setProjectMembers([])
      }
    }
    void loadMembers()
    return () => controller.abort()
  }, [eventItem])

  const canManageEvent = useMemo(() => {
    if (!user || !eventItem) return false
    if (eventItem.projectId && eventItem.projectOwner) {
      const managers = new Set(projectMembers.filter((m) => m.role === 'manager').map((m) => m.membershipNumber))
      return eventItem.projectOwner === user.membershipNumber || managers.has(user.membershipNumber)
    }
    return eventItem.createdBy === user.membershipNumber
  }, [eventItem, projectMembers, user])

  const ticketMap = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets])

  const handleStatus = async (registrationId: string, status: 'attended' | 'no_show' | 'cancelled') => {
    setError(null)
    setSuccess(null)
    setBusyRegistrationId(registrationId)
    try {
      const payload = await updateEventRegistration(registrationId, { status })
      setRegistrations((previous) => previous.map((item) => (item.id === registrationId ? payload.eventRegistration : item)))
      setSuccess('تم تحديث حالة التسجيل بنجاح.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحديث الحالة.')
    } finally {
      setBusyRegistrationId(null)
    }
  }

  const handleApprove = async (registrationId: string, type: 'payment' | 'attendance') => {
    if (!user) return
    setError(null)
    setSuccess(null)
    setBusyRegistrationId(registrationId)
    try {
      const payload = await approveRegistration(registrationId, user.membershipNumber, type)
      setRegistrations((previous) => previous.map((item) => (item.id === registrationId ? payload.eventRegistration : item)))
      setSuccess(type === 'payment' ? 'تم اعتماد الدفع.' : 'تم اعتماد الحضور.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر اعتماد التسجيل.')
    } finally {
      setBusyRegistrationId(null)
    }
  }

  const handleDelete = async (registrationId: string) => {
    if (!window.confirm('هل تريد حذف هذا التسجيل؟')) return
    setError(null)
    setSuccess(null)
    setBusyRegistrationId(registrationId)
    try {
      await deleteEventRegistration(registrationId)
      setRegistrations((previous) => previous.filter((item) => item.id !== registrationId))
      setSuccess('تم حذف التسجيل.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر حذف التسجيل.')
    } finally {
      setBusyRegistrationId(null)
    }
  }

  if (!eventID || notFound) return <Navigate to="/dashboard/events" replace />

  if (isLoading || !eventItem) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">جار تحميل صفحة إدارة التسجيلات...</p>
      </section>
    )
  }

  if (!canManageEvent) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-medium text-amber-900">لا تملك صلاحية إدارة تسجيلات هذه الفعالية.</p>
        <Link to={`/dashboard/event/${eventID}`} className="mt-3 inline-flex text-sm font-semibold text-amber-800 underline">
          العودة إلى الفعالية
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">لوحة الإدارة</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{eventItem.name}</h1>
            <p className="mt-2 text-sm text-slate-600">إدارة جميع المسجلين وتحديث الحالات أو حذف التسجيل.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/event/${eventID}`} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              صفحة الفعالية
            </Link>
            <Link to={`/dashboard/event/${eventID}/edit`} className="rounded-lg border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              تعديل الفعالية
            </Link>
          </div>
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="h-5 w-5 text-slate-700" />
          <h2 className="text-base font-semibold text-slate-900">المسجلون</h2>
          <span className="mr-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {registrations.length} تسجيل
          </span>
        </div>

        {registrations.length === 0 ? <p className="text-sm text-slate-500">لا توجد تسجيلات بعد.</p> : null}

        <ul className="space-y-2">
          {registrations.map((registration) => {
            const ticket = ticketMap.get(registration.ticketId)
            const busy = busyRegistrationId === registration.id

            return (
              <li key={registration.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm text-slate-900">{registration.membershipNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-500">التذكرة: {ticket ? ticket.name : 'غير معروفة'}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {registrationStatusLabel(registration.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!registration.paymentApprovedBy ? (
                    <button
                      type="button"
                      onClick={() => void handleApprove(registration.id, 'payment')}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle className="h-3 w-3" />
                      اعتماد الدفع
                    </button>
                  ) : null}
                  {!registration.attendanceApprovedBy ? (
                    <button
                      type="button"
                      onClick={() => void handleApprove(registration.id, 'attendance')}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle className="h-3 w-3" />
                      اعتماد الحضور
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleStatus(registration.id, 'attended')}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle className="h-3 w-3" />
                    حضر
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleStatus(registration.id, 'no_show')}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Clock className="h-3 w-3" />
                    لم يحضر
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleStatus(registration.id, 'cancelled')}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(registration.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3 w-3" />
                    حذف التسجيل
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-3 text-sm font-medium text-emerald-700">{success}</p> : null}
      </article>
    </section>
  )
}
