import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  Send,
  ArrowLeft,
} from 'lucide-react'
import Avatar from 'boring-avatars'
import {
  createEventRegistration,
  fetchEventById,
  fetchEventRegistrations,
  fetchEventTickets,
  fetchProjectMembers,
  fetchPublicEventById,
  fetchPublicEventTickets,
  requestTelegramGroupInvite,
  selfCancelEventRegistration,
  changeEventRegistrationTicket,
} from '../../api/vms'
import type {
  VmsEvent,
  VmsEventRegistration,
  VmsEventTicket,
  VmsProjectMember,
} from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { isStandalonePublicEventPath } from '../../utils/public-event-routes'
import { formatDateEnCA, formatTimeEnCA, formatTimezoneEnCA } from '../../utils/date-format'
import {
  canSelfModifyRegistration,
  selfCancellationHelperText,
} from '../../utils/event-registration-cancellation'

function eventStatusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

function registrationStatusLabel(status: string) {
  if (status === 'registered') return 'مسجل'
  if (status === 'attended') return 'حضر'
  if (status === 'cancelled') return 'ملغي'
  if (status === 'no_show') return 'لم يحضر'
  return status
}

const ATTENDEE_AVATAR_COLORS = ['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']

function attendeeAvatarKeys(seed: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${seed}:${index}`)
}

export function DashboardEventDetailsPage() {
  const { eventID } = useParams()
  const location = useLocation()
  const user = useMemo(() => getStoredUser(), [])
  const isStandaloneView = isStandalonePublicEventPath(location.pathname)
  const loginRedirect = `${location.pathname}${location.search}`
  const ticketBuyingSectionRef = useRef<HTMLDivElement | null>(null)
  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [tickets, setTickets] = useState<VmsEventTicket[]>([])
  const [myRegistration, setMyRegistration] = useState<VmsEventRegistration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isSendingTelegramInvite, setIsSendingTelegramInvite] = useState(false)
  const [telegramInviteError, setTelegramInviteError] = useState<string | null>(null)
  const [telegramInviteSuccess, setTelegramInviteSuccess] = useState<string | null>(null)
  const [isCancellingRegistration, setIsCancellingRegistration] = useState(false)
  const [cancelRegistrationError, setCancelRegistrationError] = useState<string | null>(null)
  const [cancelRegistrationSuccess, setCancelRegistrationSuccess] = useState<string | null>(null)
  const [isChangingTicket, setIsChangingTicket] = useState(false)
  const [changeTicketError, setChangeTicketError] = useState<string | null>(null)
  const [changeTicketSuccess, setChangeTicketSuccess] = useState<string | null>(null)
  const [selectedChangeTicketId, setSelectedChangeTicketId] = useState<string | null>(null)
  const [isChangeTicketPickerOpen, setIsChangeTicketPickerOpen] = useState(false)

  function adjustTicketActiveCount(ticketId: string, delta: number) {
    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              activeRegistrationCount: Math.max(0, (ticket.activeRegistrationCount ?? 0) + delta),
            }
          : ticket,
      ),
    )
  }

  function scrollToTicketBuyingSection() {
    ticketBuyingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (!eventID) {
      return
    }

    const currentEventId = eventID

    const controller = new AbortController()

    async function loadEventDetails() {
      try {
        if (user) {
          const [eventPayload, ticketsPayload, myRegistrationPayload] = await Promise.all([
            fetchEventById(currentEventId),
            fetchEventTickets(currentEventId),
            fetchEventRegistrations(currentEventId, { membershipNumber: user.membershipNumber }),
          ])

          if (controller.signal.aborted) {
            return
          }

          setEventItem(eventPayload.event)
          setTickets(ticketsPayload.eventTickets)
          setMyRegistration(myRegistrationPayload.eventRegistrations[0] ?? null)
          return
        }

        const [eventPayload, ticketsPayload] = await Promise.all([
          fetchPublicEventById(currentEventId),
          fetchPublicEventTickets(currentEventId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setEventItem(eventPayload.event)
        setTickets(ticketsPayload.eventTickets)
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
  }, [eventID, user])

  useEffect(() => {
    if (!user || !eventItem || !eventItem.projectId) {
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
  }, [eventItem, user])

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
  const hasUserRegistered = useMemo(() => myRegistration?.status === 'registered', [myRegistration])
  const userRegistration = myRegistration
  const userRegisteredTicket = useMemo(() => {
    if (!userRegistration) {
      return null
    }

    return tickets.find((ticket) => ticket.id === userRegistration.ticketId) ?? null
  }, [tickets, userRegistration])
  const canSendTelegramInvite = Boolean(
    eventItem?.telegramGroupId && user?.membershipNumber && userRegistration?.status === 'registered',
  )
  const canViewAttendeeNumbers = eventItem?.displayAttendeeNumbers !== false || canEditEvent
  const ticketRegistrationCounts = useMemo(
    () => Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket.activeRegistrationCount ?? 0])),
    [tickets],
  )
  const registrationsTotal = useMemo(
    () => tickets.reduce((sum, ticket) => sum + (ticket.activeRegistrationCount ?? 0), 0),
    [tickets],
  )
  const canModifyRegistration = useMemo(() => {
    if (!eventItem || !userRegistration) {
      return false
    }

    return canSelfModifyRegistration(eventItem, userRegistration, user?.membershipNumber)
  }, [eventItem, user?.membershipNumber, userRegistration])
  const hasMultipleTicketTypes = tickets.length > 1
  const alternateTickets = useMemo(() => {
    if (!userRegistration) {
      return tickets
    }

    return tickets.filter((ticket) => ticket.id !== userRegistration.ticketId)
  }, [tickets, userRegistration])
  const canChangeTicket = canModifyRegistration && hasMultipleTicketTypes
  const modificationPolicyText = eventItem ? selfCancellationHelperText(eventItem) : null
  const telegramInviteHelperText = !user
    ? 'سجّل الدخول أولاً ثم سجّل في هذه الفعالية لإرسال دعوة مجموعة التلغرام.'
    : !hasUserRegistered
      ? 'أرسل دعوة مجموعة التلغرام متاح فقط للمسجلين في هذه الفعالية.'
      : null

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

    const existingRegistration = myRegistration
    if (existingRegistration) {
      setApplyError('لديك تسجيل سابق في هذه الفعالية. تواصل مع المنظمين إذا كنت بحاجة للمساعدة.')
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

      setMyRegistration(payload.eventRegistration)
      adjustTicketActiveCount(payload.eventRegistration.ticketId, 1)
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

  const handleCancelRegistration = async () => {
    setCancelRegistrationError(null)
    setCancelRegistrationSuccess(null)

    if (!userRegistration || !user || !canModifyRegistration) {
      return
    }

    const confirmed = window.confirm(
      'هل أنت متأكد من إلغاء تسجيلك في هذه الفعالية؟ يمكنك التسجيل مجدداً إذا بقيت مقاعد متاحة.',
    )
    if (!confirmed) {
      return
    }

    setIsCancellingRegistration(true)

    try {
      await selfCancelEventRegistration(userRegistration.id)
      setMyRegistration(null)
      adjustTicketActiveCount(userRegistration.ticketId, -1)
      setCancelRegistrationSuccess('تم إلغاء تسجيلك. يمكنك التسجيل مجدداً إذا رغبت.')
      setChangeTicketSuccess(null)
      setChangeTicketError(null)
      setIsChangeTicketPickerOpen(false)
      setSelectedChangeTicketId(null)
      setTelegramInviteSuccess(null)
      setTelegramInviteError(null)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCancelRegistrationError(requestError.message)
      } else {
        setCancelRegistrationError('تعذر إلغاء التسجيل.')
      }
    } finally {
      setIsCancellingRegistration(false)
    }
  }

  const handleChangeTicket = async () => {
    setChangeTicketError(null)
    setChangeTicketSuccess(null)

    if (!userRegistration || !user || !canChangeTicket || !selectedChangeTicketId) {
      return
    }

    const targetTicket = tickets.find((ticket) => ticket.id === selectedChangeTicketId)
    const confirmed = window.confirm(
      targetTicket
        ? `هل تريد تغيير تذكرتك إلى «${targetTicket.name}»؟`
        : 'هل تريد تغيير التذكرة؟',
    )
    if (!confirmed) {
      return
    }

    setIsChangingTicket(true)

    try {
      const payload = await changeEventRegistrationTicket(userRegistration.id, selectedChangeTicketId)
      setMyRegistration(payload.eventRegistration)
      adjustTicketActiveCount(userRegistration.ticketId, -1)
      adjustTicketActiveCount(payload.eventRegistration.ticketId, 1)
      setChangeTicketSuccess('تم تغيير التذكرة بنجاح.')
      setCancelRegistrationSuccess(null)
      setCancelRegistrationError(null)
      setIsChangeTicketPickerOpen(false)
      setSelectedChangeTicketId(null)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setChangeTicketError(requestError.message)
      } else {
        setChangeTicketError('تعذر تغيير التذكرة.')
      }
    } finally {
      setIsChangingTicket(false)
    }
  }

  const handleSendTelegramInvite = async () => {
    setTelegramInviteError(null)
    setTelegramInviteSuccess(null)

    if (!eventItem?.telegramGroupId || !user?.membershipNumber) {
      return
    }

    setIsSendingTelegramInvite(true)
    try {
      await requestTelegramGroupInvite(user.membershipNumber, {
        resourceType: 'event',
        resourceId: eventItem.id,
      })
      setTelegramInviteSuccess('تم إرسال دعوة مجموعة التلغرام عبر البوت.')
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTelegramInviteError(requestError.message)
      } else {
        setTelegramInviteError('تعذر إرسال دعوة مجموعة التلغرام.')
      }
    } finally {
      setIsSendingTelegramInvite(false)
    }
  }

  if (!eventID || notFound) {
    return <Navigate to={isStandaloneView ? '/' : '/dashboard/events'} replace />
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
      <div className="flex justify-start">
        <Link
          to={isStandaloneView ? '/' : '/dashboard/events'}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {isStandaloneView ? 'العودة للرئيسية' : 'العودة للفعاليات'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

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
            <button
              type="button"
              onClick={() => {
                if (!hasUserRegistered) {
                  scrollToTicketBuyingSection()
                }
              }}
              disabled={hasUserRegistered}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition ${
                hasUserRegistered
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500'
                  : 'border-cyan-200 bg-transparent text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800'
              }`}
            >
              {hasUserRegistered ? 'مسجّل بالفعل' : 'سجّل الآن'}
              {hasUserRegistered ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.415l2.543 2.543 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {hasUserRegistered && userRegisteredTicket ? (
          <div className="border-t border-slate-100 px-5 pb-5 sm:px-6 md:px-8">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              أنت مسجّل في هذه الفعالية. التذكرة المختارة:{' '}
              <span className="font-semibold">{userRegisteredTicket.name}</span>
            </p>
          </div>
        ) : null}
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
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-slate-500">البداية</p>
            <p className="text-sm font-semibold leading-snug text-slate-900">{formatDateEnCA(eventItem.startTime)}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-lg bg-slate-100 px-2 py-1">{formatTimeEnCA(eventItem.startTime)}</span>
              <span className="rounded-lg bg-slate-100 px-2 py-1">{formatTimezoneEnCA(eventItem.startTime)}</span>
            </div>
          </div>
        </div>
        <div className="group flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition hover:border-cyan-200/80 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Clock className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-slate-500">النهاية</p>
            <p className="text-sm font-semibold leading-snug text-slate-900">{formatDateEnCA(eventItem.endTime)}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-lg bg-slate-100 px-2 py-1">{formatTimeEnCA(eventItem.endTime)}</span>
              <span className="rounded-lg bg-slate-100 px-2 py-1">{formatTimezoneEnCA(eventItem.endTime)}</span>
            </div>
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

      {eventItem.telegramGroupId ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Link2 className="h-5 w-5 text-cyan-600" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">مجموعة التلغرام</h2>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSendTelegramInvite()}
              disabled={isSendingTelegramInvite || !canSendTelegramInvite}
              title={!canSendTelegramInvite ? telegramInviteHelperText ?? undefined : undefined}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Send className="h-4 w-4" />
              {isSendingTelegramInvite ? 'جار الإرسال...' : 'إرسال دعوة المجموعة عبر البوت'}
            </button>
          </div>
          {telegramInviteHelperText ? <p className="mt-3 text-sm text-slate-600">{telegramInviteHelperText}</p> : null}
          {telegramInviteError ? <p className="mt-3 text-sm text-red-600">{telegramInviteError}</p> : null}
          {telegramInviteSuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{telegramInviteSuccess}</p> : null}
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

          <div ref={ticketBuyingSectionRef} className="scroll-mt-24">
            {!user && tickets.length > 0 ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                <p className="font-semibold">التسجيل في الفعالية يتطلب حساباً مفعّلاً</p>
                <p className="mt-2 leading-7">
                  يمكنك الاطلاع على تفاصيل الفعالية والتذاكر بدون تسجيل دخول. للتقديم، سجّل الدخول أولاً.
                </p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(loginRedirect)}`}
                  className="mt-3 inline-flex font-semibold text-amber-900 underline-offset-4 hover:underline"
                >
                  تسجيل الدخول للتقديم
                </Link>
              </div>
            ) : null}
            {user && tickets.length > 0 && !hasUserRegistered ? (
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
                      className={`group rounded-xl border-2 p-4 text-left shadow-sm transition-all duration-200 hover:scale-[1.01] hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
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
                        {isSelected ? (
                          <svg className="h-5 w-5 shrink-0 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <ArrowLeft className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-slate-600" />
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
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-center text-sm font-medium text-emerald-800">✓ مسجّل مسبقاً في هذه الفعالية</p>
                {userRegisteredTicket ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4 text-right shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">التذكرة التي اخترتها</p>
                        <p className="mt-1 font-semibold text-slate-900">{userRegisteredTicket.name}</p>
                        {userRegisteredTicket.description ? (
                          <p className="mt-1 text-xs leading-6 text-slate-500">{userRegisteredTicket.description}</p>
                        ) : null}
                      </div>
                      <Ticket className="h-5 w-5 shrink-0 text-emerald-700" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
                        {userRegisteredTicket.quantity} مقعد
                      </span>
                      <span className="rounded-lg bg-cyan-100 px-2 py-1 font-medium text-cyan-800">
                        {userRegisteredTicket.pointPrice} نقطة
                      </span>
                      {userRegisteredTicket.currencyPrice ? (
                        <span className="rounded-lg bg-amber-100 px-2 py-1 font-medium text-amber-800">
                          {userRegisteredTicket.currencyPrice}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-emerald-100 px-2 py-1 font-medium text-emerald-800">
                          مجاني
                        </span>
                      )}
                      {userRegistration ? (
                        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-medium text-emerald-800">
                          الحالة: {registrationStatusLabel(userRegistration.status)}
                        </span>
                      ) : null}
                    </div>
                    {user && userRegistration?.status === 'registered' ? (
                      <div className="mt-4 space-y-2 border-t border-emerald-100 pt-4">
                        {canModifyRegistration ? (
                          <div className={`grid gap-2 ${canChangeTicket ? 'sm:grid-cols-2' : ''}`}>
                            {canChangeTicket ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setChangeTicketError(null)
                                  setChangeTicketSuccess(null)
                                  setIsChangeTicketPickerOpen((previous) => !previous)
                                  setSelectedChangeTicketId(null)
                                }}
                                disabled={isChangingTicket || isCancellingRegistration}
                                className="inline-flex w-full items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isChangeTicketPickerOpen ? 'إخفاء التذاكر' : 'تغيير التذكرة'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void handleCancelRegistration()}
                              disabled={isCancellingRegistration || isChangingTicket}
                              className="inline-flex w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isCancellingRegistration ? 'جار الإلغاء...' : 'إلغاء التسجيل'}
                            </button>
                          </div>
                        ) : modificationPolicyText ? (
                          <p className="text-xs leading-6 text-slate-600">{modificationPolicyText}</p>
                        ) : null}
                        {canChangeTicket && isChangeTicketPickerOpen ? (
                          <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-3">
                            <p className="text-xs font-medium text-slate-700">اختر التذكرة الجديدة:</p>
                            <div className="space-y-2">
                              {alternateTickets.map((ticket) => (
                                <label
                                  key={ticket.id}
                                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                                    selectedChangeTicketId === ticket.id
                                      ? 'border-cyan-400 bg-white shadow-sm'
                                      : 'border-slate-200 bg-white hover:border-cyan-200'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="changeTicket"
                                    value={ticket.id}
                                    checked={selectedChangeTicketId === ticket.id}
                                    onChange={() => setSelectedChangeTicketId(ticket.id)}
                                    className="mt-1"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-slate-900">{ticket.name}</span>
                                    {ticket.description ? (
                                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{ticket.description}</span>
                                    ) : null}
                                    <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{ticket.pointPrice} نقطة</span>
                                      {ticket.currencyPrice ? (
                                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">{ticket.currencyPrice}</span>
                                      ) : (
                                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">مجاني</span>
                                      )}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleChangeTicket()}
                              disabled={isChangingTicket || !selectedChangeTicketId}
                              className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            >
                              {isChangingTicket ? 'جار التغيير...' : 'تأكيد تغيير التذكرة'}
                            </button>
                          </div>
                        ) : null}
                        {changeTicketError ? (
                          <p className="text-sm text-red-600">{changeTicketError}</p>
                        ) : null}
                        {changeTicketSuccess ? (
                          <p className="text-sm font-medium text-emerald-700">{changeTicketSuccess}</p>
                        ) : null}
                        {cancelRegistrationError ? (
                          <p className="text-sm text-red-600">{cancelRegistrationError}</p>
                        ) : null}
                        {cancelRegistrationSuccess ? (
                          <p className="text-sm font-medium text-emerald-700">{cancelRegistrationSuccess}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-center text-xs text-emerald-700">تعذّر عرض تفاصيل التذكرة المختارة.</p>
                )}
              </div>
            ) : null}
            {tickets.length === 0 ? (
              <p className="mt-5 text-center text-sm text-slate-500">لا توجد تذاكر متاحة لهذه الفعالية بعد.</p>
            ) : null}
            {applyError ? <p className="mt-3 text-sm text-red-600">{applyError}</p> : null}
            {applySuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{applySuccess}</p> : null}
          </div>

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
            {user && canViewAttendeeNumbers ? (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                المسجّلون
                {registrationsTotal > 0 ? (
                  <span className="mr-2 font-normal normal-case text-slate-600">({registrationsTotal})</span>
                ) : null}
              </h3>
              {registrationsTotal > 0 ? (
                <div className="space-y-6">
                  {tickets.map((ticket) => {
                    const count = ticketRegistrationCounts[ticket.id] ?? 0
                    if (count === 0) {
                      return null
                    }

                    return (
                      <div key={ticket.id}>
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          {ticket.name}
                          <span className="ml-2 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-800">
                            {count} {count === 1 ? 'مسجّل' : 'مسجّلين'}
                          </span>
                        </h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attendeeAvatarKeys(ticket.id, count).map((avatarKey) => (
                            <Avatar
                              key={avatarKey}
                              size={40}
                              name={avatarKey}
                              variant="beam"
                              colors={ATTENDEE_AVATAR_COLORS}
                              className="ring-2 ring-white shadow-sm"
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {Object.entries(ticketRegistrationCounts)
                    .filter(([ticketId]) => !tickets.some((ticket) => ticket.id === ticketId))
                    .map(([ticketId, count]) => (
                      <div key={ticketId}>
                        <h4 className="mb-2 text-sm font-semibold text-slate-700">
                          تذاكر أخرى
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {count} {count === 1 ? 'مسجّل' : 'مسجّلين'}
                          </span>
                        </h4>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {attendeeAvatarKeys(ticketId, count).map((avatarKey) => (
                            <Avatar
                              key={avatarKey}
                              size={40}
                              name={avatarKey}
                              variant="beam"
                              colors={ATTENDEE_AVATAR_COLORS}
                              className="ring-2 ring-white shadow-sm"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">لا توجد تسجيلات لهذه الفعالية بعد.</p>
              )}
            </div>
            ) : !canViewAttendeeNumbers && user ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                عدد المسجّلين في هذه الفعالية غير معروض علناً.
              </div>
            ) : null}
          </div>
          {tickets.length === 0 && registrationsTotal === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-500">لا توجد تذاكر أو تسجيلات لهذه الفعالية بعد.</p>
          ) : null}
        </div>
      </article>
    </section>
  )
}