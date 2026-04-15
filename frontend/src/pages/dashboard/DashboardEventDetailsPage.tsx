import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Clock,
  MapPin,
  Calendar,
  PencilLine,
  Link2,
  Sparkles,
  Ticket,
  Users,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import Avatar from 'boring-avatars'
import {
  createEventRegistration,
  fetchEventById,
  fetchEventRegistrations,
  fetchEventTickets,
  fetchProjectMembers,
} from '../../api/vms'
import type {
  VmsEvent,
  VmsEventRegistration,
  VmsEventTicket,
  VmsProjectMember,
} from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { formatDateTimeEnCA } from '../../utils/date-format'

function eventStatusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

export function DashboardEventDetailsPage() {
  const { eventID } = useParams()
  const user = useMemo(() => getStoredUser(), [])
  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [tickets, setTickets] = useState<VmsEventTicket[]>([])
  const [registrations, setRegistrations] = useState<VmsEventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])

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

  useEffect(() => {
    if (!eventItem || !eventItem.projectId) {
      setProjectMembers([])
      return
    }

    const currentProjectId = eventItem.projectId
    const controller = new AbortController()

    async function loadEventProjectInfo() {
      try {
        const projectMembersPayload = await fetchProjectMembers(currentProjectId)

        if (controller.signal.aborted) {
          return
        }

        setProjectMembers(projectMembersPayload.projectMembers)
      } catch {
        if (!controller.signal.aborted) {
          setProjectMembers([])
        }
      }
    }

    loadEventProjectInfo()

    return () => {
      controller.abort()
    }
  }, [eventItem])

  const canEditEvent = useMemo(() => {
    if (!user || !eventItem) {
      return false
    }

    if (eventItem.projectId && eventItem.projectOwner) {
      const managerMembershipNumbers = new Set(
        projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber),
      )

      return eventItem.projectOwner === user.membershipNumber || managerMembershipNumbers.has(user.membershipNumber)
    }

    return eventItem.createdBy === user.membershipNumber
  }, [eventItem, projectMembers, user])

  const totalTicketCapacity = useMemo(() => tickets.reduce((sum, ticket) => sum + ticket.quantity, 0), [tickets])
  const hasUserRegistered = useMemo(() => {
    if (!user) {
      return false
    }

    return registrations.some((registration) => registration.membershipNumber === user.membershipNumber)
  }, [registrations, user])

  const handleApplyToEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApplyError(null)
    setApplySuccess(null)

    if (!eventID) {
      return
    }

    if (!user) {
      setApplyError('يجب تسجيل الدخول قبل التقديم للفعالية.')
      return
    }

    if (hasUserRegistered) {
      setApplyError('لقد قمت بالتسجيل في هذه الفعالية مسبقاً.')
      return
    }

    if (!selectedTicketId) {
      setApplyError('يرجى اختيار تذكرة للتسجيل.')
      return
    }

    const applyForm = event.currentTarget
    setIsApplying(true)

    try {
      const payload = await createEventRegistration({
        eventId: eventID,
        membershipNumber: user.membershipNumber,
        ticketId: selectedTicketId,
        status: 'registered',
      })

      setRegistrations((previous) => [payload.eventRegistration, ...previous])
      setApplySuccess('تم إرسال طلب التسجيل بنجاح.')
      setSelectedTicketId(null)
      applyForm.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setApplyError(requestError.message)
      } else {
        setApplyError('تعذر إرسال طلب التسجيل.')
      }
    } finally {
      setIsApplying(false)
    }
  }

  if (!eventID || notFound) {
    return <Navigate to="/dashboard/events" replace />
  }

  if (isLoading || !eventItem) {
    return (
      <section className="mx-auto max-w-5xl space-y-4 px-1 sm:px-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="h-40 animate-pulse bg-linear-to-br from-slate-100 to-slate-200 sm:h-48" />
          <div className="space-y-3 p-6">
            <div className="h-4 w-3/4 max-w-xs animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <p className="text-center text-sm text-slate-500">جار تحميل تفاصيل الفعالية...</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Hero: banner + title */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5">
        {eventItem.imageUrl ? (
          <div className="relative h-44 sm:h-52 md:h-60">
            <img
              src={eventItem.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/50 via-slate-900/10 to-transparent" />
          </div>
        ) : (
          <div className="relative flex h-36 items-center justify-center bg-linear-to-br from-slate-100 via-slate-50 to-cyan-50/40 sm:h-44">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <Calendar className="h-10 w-10 text-slate-400" strokeWidth={1.25} />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 md:p-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700/90">تفاصيل الفعالية</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{eventItem.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {eventItem.description ?? 'لا يوجد وصف متاح للفعالية.'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:gap-2 lg:flex-row">
            {canEditEvent ? (
              <>
                <Link
                  to={`/dashboard/event/${eventItem.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  <PencilLine className="h-4 w-4" />
                  تعديل الفعالية
                </Link>
                <Link
                  to={`/dashboard/event/${eventItem.id}/admin`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-800 shadow-sm transition hover:bg-cyan-100"
                >
                  <Users className="h-4 w-4" />
                  إدارة التسجيلات
                </Link>
              </>
            ) : null}
            <Link
              to="/dashboard/events"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              العودة للفعاليات
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {canEditEvent ? (
        <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 px-4 py-3 text-center text-sm text-slate-600">
          تعديل بيانات الفعالية متاح من صفحة التحرير الموحدة، وإدارة التسجيلات من صفحة الإدارة.
          <Link to={`/dashboard/event/${eventItem.id}/admin`} className="mr-1 font-semibold text-cyan-700 underline">
            الانتقال إلى إدارة التسجيلات
          </Link>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition hover:border-cyan-200/80 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <Calendar className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">البداية</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{formatDateTimeEnCA(eventItem.startTime)}</p>
          </div>
        </div>
        <div className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition hover:border-cyan-200/80 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Clock className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">النهاية</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{formatDateTimeEnCA(eventItem.endTime)}</p>
          </div>
        </div>
        <div className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition hover:border-cyan-200/80 hover:shadow-md sm:col-span-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
            <MapPin className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">الحالة</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{eventStatusLabel(eventItem.status)}</p>
          </div>
        </div>
      </div>

      {eventItem.address === 'online' || eventItem.country || eventItem.region || eventItem.city || eventItem.address ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">تفاصيل الموقع</h2>
          </div>
          {eventItem.address === 'online' ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">فعالية أون لاين</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {eventItem.country && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">الدولة</span>
                  <p className="mt-1 font-semibold text-slate-900">{eventItem.country}</p>
                </div>
              )}
              {eventItem.region && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">المنطقة</span>
                  <p className="mt-1 font-semibold text-slate-900">{eventItem.region}</p>
                </div>
              )}
              {eventItem.city && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">المدينة</span>
                  <p className="mt-1 font-semibold text-slate-900">{eventItem.city}</p>
                </div>
              )}
              {eventItem.address && (
                <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">العنوان التفصيلي</span>
                  <p className="mt-1 font-semibold text-slate-900">{eventItem.address}</p>
                </div>
              )}
            </div>
          )}
        </article>
      ) : null}

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-slate-900">معلومات إضافية</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <span className="text-slate-500">المشروع</span>
            <p className="mt-1 font-mono text-sm font-medium text-slate-900">
              {eventItem.projectName ?? (eventItem.projectId ? 'غير متاح' : 'غير مرتبط بمشروع')}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <span className="text-slate-500">سعة التذاكر</span>
            <p className="mt-1 font-semibold text-slate-900">{totalTicketCapacity} مقعد</p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-slate-900">المهارات</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.keys(eventItem.skills ?? {}).length === 0 ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">لا توجد مهارات مرتبطة</span>
          ) : null}
          {Object.entries(eventItem.skills ?? {}).map(([skillName, skillType]) => (
            <span
              key={skillName}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-linear-to-br from-white to-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm"
            >
              {skillName}
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">{skillType}</span>
            </span>
          ))}
        </div>
      </article>

      {eventItem.associatedUrls && Object.keys(eventItem.associatedUrls).length > 0 ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Link2 className="h-5 w-5 text-cyan-600" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">الروابط المرتبطة</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(eventItem.associatedUrls).map(([label, url]) => (
              <a
                key={label}
                href={typeof url === 'string' ? url : String(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-100 hover:text-cyan-800"
              >
                {label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </article>
      ) : null}

      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5">
        <div className="border-b border-slate-100 bg-linear-to-l from-slate-50 to-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Ticket className="h-5 w-5 text-slate-700" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">التذاكر والتسجيلات</h2>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          {canEditEvent ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              إدارة التذاكر أصبحت ضمن صفحة تعديل الفعالية.
              <Link to={`/dashboard/event/${eventItem.id}/edit`} className="mr-1 font-semibold text-cyan-700 underline">
                الانتقال لصفحة التعديل
              </Link>
            </p>
          ) : null}

          {tickets.length > 0 && !hasUserRegistered ? (
            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-slate-700">اختر تذكرة للتقديم:</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tickets.map((ticket) => {
                  const isSelected = selectedTicketId === ticket.id
                  const isDisabled = isApplying || tickets.length === 0
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => !isDisabled && setSelectedTicketId(isSelected ? null : ticket.id)}
                      disabled={isDisabled}
                      className={`rounded-xl border-2 p-4 text-left shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50 shadow-cyan-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{ticket.name}</p>
                          {ticket.description ? (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
                          ) : null}
                        </div>
                        {isSelected && (
                          <svg className="h-5 w-5 shrink-0 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
                          {ticket.quantity} مقعد
                        </span>
                        <span className="rounded-lg bg-cyan-100 px-2 py-1 font-medium text-cyan-800">
                          {ticket.pointPrice} نقطة
                        </span>
                        {ticket.currencyPrice ? (
                          <span className="rounded-lg bg-amber-100 px-2 py-1 font-medium text-amber-800">
                            {ticket.currencyPrice}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-emerald-100 px-2 py-1 font-medium text-emerald-800">
                            مجاني
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedTicketId && (
                <form onSubmit={handleApplyToEvent} className="mt-4">
                  <button
                    type="submit"
                    disabled={isApplying || !selectedTicketId}
                    className="w-full rounded-lg bg-cyan-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isApplying ? 'جار الإرسال...' : 'تقديم الطلب'}
                  </button>
                </form>
              )}
            </div>
          ) : null}
          {hasUserRegistered ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-medium text-emerald-800">✓ مسجّل مسبقاً في هذه الفعالية</p>
            </div>
          ) : null}
          {tickets.length === 0 ? (
            <p className="mt-5 text-center text-sm text-slate-500">لا توجد تذاكر متاحة لهذه الفعالية بعد.</p>
          ) : null}
          {applyError ? <p className="mt-3 text-sm text-red-600">{applyError}</p> : null}
          {applySuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{applySuccess}</p> : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">أنواع التذاكر</h3>
              <ul className="space-y-2">
                {tickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
                  >
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">{ticket.name}</p>
                            {ticket.description ? (
                              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
                            ) : null}
                          </div>
                          {ticket.currencyPrice ? (
                            <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              {ticket.currencyPrice}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              مجاني
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          الكمية: {ticket.quantity} • النقاط: {ticket.pointPrice}
                        </p>
                      </>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">المسجّلون</h3>
              {tickets.length > 0 && registrations.length > 0 ? (
                <div className="space-y-6">
                  {tickets.map((ticket) => {
                    const ticketRegistrations = registrations.filter((reg) => reg.ticketId === ticket.id)
                    if (ticketRegistrations.length === 0) return null

                    return (
                      <div key={ticket.id}>
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          {ticket.name}
                          <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-800">
                            {ticketRegistrations.length} {ticketRegistrations.length === 1 ? 'مسجّل' : 'مسجّلين'}
                          </span>
                        </h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ticketRegistrations.map((registration) => (
                            <div key={registration.id} className="relative">
                              <Avatar
                                size={40}
                                name={registration.id}
                                variant="beam"
                                colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
                                className="ring-2 ring-white shadow-sm"
                              />
                              <span className={`absolute -bottom-1 -right-1 rounded-full px-1 py-0.5 text-[10px] font-medium ring-1 ${
                                registration.status === 'attended'
                                  ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                                  : registration.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800 ring-red-200'
                                  : registration.status === 'no_show'
                                  ? 'bg-amber-100 text-amber-800 ring-amber-200'
                                  : 'bg-white text-slate-700 ring-slate-200'
                              }`}>
                                {registration.status === 'attended' ? '✓' : registration.status === 'cancelled' ? '✗' : registration.status === 'no_show' ? '?' : '○'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {registrations.filter((reg) => !tickets.some((t) => t.id === reg.ticketId)).length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">
                        تذاكر أخرى
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {registrations.filter((reg) => !tickets.some((t) => t.id === reg.ticketId)).length} {registrations.filter((reg) => !tickets.some((t) => t.id === reg.ticketId)).length === 1 ? 'مسجّل' : 'مسجّلين'}
                        </span>
                      </h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {registrations.filter((reg) => !tickets.some((t) => t.id === reg.ticketId)).map((registration) => (
                          <div key={registration.id} className="relative">
                            <Avatar
                              size={40}
                              name={registration.id}
                              variant="beam"
                              colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
                              className="ring-2 ring-white shadow-sm"
                            />
                            <span className={`absolute -bottom-1 -right-1 rounded-full px-1 py-0.5 text-[10px] font-medium ring-1 ${
                              registration.status === 'attended'
                                ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                                : registration.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 ring-red-200'
                                : registration.status === 'no_show'
                                ? 'bg-amber-100 text-amber-800 ring-amber-200'
                                : 'bg-white text-slate-700 ring-slate-200'
                            }`}>
                              {registration.status === 'attended' ? '✓' : registration.status === 'cancelled' ? '✗' : registration.status === 'no_show' ? '?' : '○'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : registrations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="relative">
                      <Avatar
                        size={40}
                        name={registration.membershipNumber}
                        variant="beam"
                        colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
                        className="ring-2 ring-white shadow-sm"
                      />
                      <span className={`absolute -bottom-1 -right-1 rounded-full px-1 py-0.5 text-[10px] font-medium ring-1 ${
                        registration.status === 'attended'
                          ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                          : registration.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 ring-red-200'
                          : registration.status === 'no_show'
                          ? 'bg-amber-100 text-amber-800 ring-amber-200'
                          : 'bg-white text-slate-700 ring-slate-200'
                      }`}>
                        {registration.status === 'attended' ? '✓' : registration.status === 'cancelled' ? '✗' : registration.status === 'no_show' ? '?' : '○'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">لا توجد تسجيلات لهذه الفعالية بعد.</p>
              )}
            </div>
          </div>
          {tickets.length === 0 && registrations.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-500">لا توجد تذاكر أو تسجيلات لهذه الفعالية بعد.</p>
          ) : null}
        </div>
      </article>
    </section>
  )
}