import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  ImageIcon,
  Link2,
  MapPin,
  Pencil,
  PencilLine,
  Sparkles,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react'
import {
  createEventRegistration,
  createEventTicket,
  deleteEventTicket,
  fetchEventById,
  fetchEventRegistrations,
  fetchEventTickets,
  fetchProjectById,
  fetchProjectMembers,
  updateEventTicket,
  uploadEventBanner,
  updateEvent,
} from '../../api/vms'
import type {
  VmsEvent,
  VmsEventRegistration,
  VmsEventTicket,
  VmsProject,
  VmsProjectMember,
} from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { formatDateTimeEnCA } from '../../utils/date-format'
import { ImageUploader } from '../../components/ImageUploader'

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
  const user = useMemo(() => getStoredUser(), [])
  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [tickets, setTickets] = useState<VmsEventTicket[]>([])
  const [registrations, setRegistrations] = useState<VmsEventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)
  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [projectLoadError, setProjectLoadError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

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
      setProject(null)
      setProjectMembers([])
      setProjectLoadError(false)
      return
    }

    const currentProjectId = eventItem.projectId
    const controller = new AbortController()

    async function loadEventProjectInfo() {
      setProjectLoadError(false)

      try {
        const [projectPayload, projectMembersPayload] = await Promise.all([
          fetchProjectById(currentProjectId, user?.membershipNumber),
          fetchProjectMembers(currentProjectId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectMembers(projectMembersPayload.projectMembers)
      } catch {
        if (!controller.signal.aborted) {
          setProject(null)
          setProjectMembers([])
          setProjectLoadError(true)
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

    if (eventItem.projectId && project) {
      const managerMembershipNumbers = new Set(
        projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber),
      )

      return project.owner === user.membershipNumber || managerMembershipNumbers.has(user.membershipNumber)
    }

    return eventItem.createdBy === user.membershipNumber
  }, [eventItem, project, projectMembers, user])

  useEffect(() => {
    if (!canEditEvent) {
      setIsEditing(false)
    }
  }, [canEditEvent])

  useEffect(() => {
    if (!isEditing) {
      setSelectedBannerFile(null)
      setUploadError(null)
    }
  }, [isEditing])

  const totalTicketCapacity = useMemo(() => tickets.reduce((sum, ticket) => sum + ticket.quantity, 0), [tickets])
  const hasUserRegistered = useMemo(() => {
    if (!user) {
      return false
    }

    return registrations.some((registration) => registration.membershipNumber === user.membershipNumber)
  }, [registrations, user])

  const toDateTimeLocal = (value: string | null | undefined) => {
    if (!value) {
      return ''
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleUpdateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)

    if (!eventID || !eventItem) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const startTime = String(formData.get('startTime') ?? '').trim()
    const endTime = String(formData.get('endTime') ?? '').trim()
    const location = String(formData.get('location') ?? '').trim()
    const associatedUrlsRaw = String(formData.get('associatedUrls') ?? '').trim()

    if (!name) {
      setSaveError('يرجى إدخال اسم الفعالية.')
      return
    }

    let associatedUrls: Record<string, unknown> | undefined

    if (associatedUrlsRaw) {
      try {
        associatedUrls = JSON.parse(associatedUrlsRaw)
        if (typeof associatedUrls !== 'object' || Array.isArray(associatedUrls)) {
          setSaveError('صيغة الروابط المرتبطة غير صحيحة. يجب أن تكون كائن JSON.')
          return
        }
      } catch {
        setSaveError('صيغة الروابط المرتبطة غير صحيحة. يجب أن تكون JSON صحيح.')
        return
      }
    }

    setIsSaving(true)

    try {
      const payload = await updateEvent(eventID, {
        name,
        ...(description ? { description } : {}),
        ...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
        ...(endTime ? { endTime: new Date(endTime).toISOString() } : {}),
        ...(location ? { location } : {}),
        ...(associatedUrls ? { associatedUrls } : {}),
      })

      let updatedEvent = payload.event

      if (selectedBannerFile) {
        const bannerPayload = await uploadEventBanner(eventID, selectedBannerFile)
        updatedEvent = bannerPayload.event
      }

      setEventItem(updatedEvent)
      setSelectedBannerFile(null)
      setUploadError(null)
      setIsEditing(false)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message)
      } else {
        setSaveError('تعذر تحديث الفعالية.')
      }
    } finally {
      setIsSaving(false)
    }
  }

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

    const formData = new FormData(event.currentTarget)
    const ticketId = String(formData.get('ticketId') ?? '').trim()

    if (!ticketId) {
      setApplyError('يرجى اختيار تذكرة للتسجيل.')
      return
    }

    const applyForm = event.currentTarget
    setIsApplying(true)

    try {
      const payload = await createEventRegistration({
        eventId: eventID,
        membershipNumber: user.membershipNumber,
        ticketId,
        status: 'registered',
      })

      setRegistrations((previous) => [payload.eventRegistration, ...previous])
      setApplySuccess('تم إرسال طلب التسجيل بنجاح.')
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

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTicketError(null)

    if (!eventID) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const pointPriceRaw = Number(formData.get('pointPrice') ?? 0)
    const currencyPrice = String(formData.get('currencyPrice') ?? '').trim()
    const quantityRaw = Number(formData.get('quantity') ?? 0)

    if (!name || !currencyPrice || Number.isNaN(pointPriceRaw) || Number.isNaN(quantityRaw)) {
      setTicketError('يرجى إدخال جميع حقول التذكرة المطلوبة بشكل صحيح.')
      return
    }

    if (pointPriceRaw < 0 || quantityRaw < 0) {
      setTicketError('يجب أن تكون قيمة النقاط والكمية أرقاماً غير سالبة.')
      return
    }

    const ticketForm = event.currentTarget
    setIsCreatingTicket(true)

    try {
      const payload = await createEventTicket({
        eventId: eventID,
        name,
        description: description || undefined,
        pointPrice: Math.trunc(pointPriceRaw),
        currencyPrice,
        quantity: Math.trunc(quantityRaw),
      })

      setTickets((previous) => [payload.eventTicket, ...previous])
      ticketForm.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTicketError(requestError.message)
      } else {
        setTicketError('تعذر إنشاء التذكرة.')
      }
    } finally {
      setIsCreatingTicket(false)
    }
  }

  const handleUpdateTicket = async (event: FormEvent<HTMLFormElement>, ticketId: string) => {
    event.preventDefault()
    setTicketError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const pointPriceRaw = Number(formData.get('pointPrice') ?? 0)
    const currencyPrice = String(formData.get('currencyPrice') ?? '').trim()
    const quantityRaw = Number(formData.get('quantity') ?? 0)

    if (!name || !currencyPrice || Number.isNaN(pointPriceRaw) || Number.isNaN(quantityRaw)) {
      setTicketError('يرجى إدخال جميع حقول التذكرة المطلوبة بشكل صحيح.')
      return
    }

    if (pointPriceRaw < 0 || quantityRaw < 0) {
      setTicketError('يجب أن تكون قيمة النقاط والكمية أرقاماً غير سالبة.')
      return
    }

    setUpdatingTicketId(ticketId)

    try {
      const payload = await updateEventTicket(ticketId, {
        name,
        description: description || undefined,
        pointPrice: Math.trunc(pointPriceRaw),
        currencyPrice,
        quantity: Math.trunc(quantityRaw),
      })

      setTickets((previous) => previous.map((ticket) => (ticket.id === ticketId ? payload.eventTicket : ticket)))
      setEditingTicketId(null)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTicketError(requestError.message)
      } else {
        setTicketError('تعذر تحديث التذكرة.')
      }
    } finally {
      setUpdatingTicketId(null)
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه التذكرة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return
    }

    setTicketError(null)
    setDeletingTicketId(ticketId)

    try {
      await deleteEventTicket(ticketId)
      setTickets((previous) => previous.filter((ticket) => ticket.id !== ticketId))
      setEditingTicketId((current) => (current === ticketId ? null : current))
    } catch (requestError) {
      if (requestError instanceof Error) {
        setTicketError(requestError.message)
      } else {
        setTicketError('تعذر حذف التذكرة.')
      }
    } finally {
      setDeletingTicketId(null)
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
              <button
                type="button"
                onClick={() => setIsEditing((previous) => !previous)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                {isEditing ? (
                  'إلغاء التعديل'
                ) : (
                  <>
                    <PencilLine className="h-4 w-4" />
                    تعديل الفعالية
                  </>
                )}
              </button>
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

      {isEditing && canEditEvent ? (
        <article className="rounded-2xl border border-cyan-200/60 bg-linear-to-br from-white to-cyan-50/30 p-5 shadow-sm ring-1 ring-cyan-900/5 sm:p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-cyan-100 pb-3">
            <PencilLine className="h-5 w-5 text-cyan-700" />
            <p className="text-base font-semibold text-slate-900">تعديل الفعالية</p>
          </div>
          <form onSubmit={handleUpdateEvent} className="mt-4 grid gap-4 md:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">اسم الفعالية</span>
              <input
                name="name"
                defaultValue={eventItem.name}
                placeholder="اسم الفعالية"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">وقت البداية</span>
              <input
                name="startTime"
                type="datetime-local"
                defaultValue={toDateTimeLocal(eventItem.startTime)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">وقت النهاية</span>
              <input
                name="endTime"
                type="datetime-local"
                defaultValue={toDateTimeLocal(eventItem.endTime)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'جار الحفظ...' : 'حفظ التعديلات'}
            </button>
            <label className="md:col-span-2 space-y-1">
              <span className="text-xs font-medium text-slate-700">الموقع</span>
              <input
                name="location"
                defaultValue={eventItem.location ?? ''}
                placeholder="الموقع"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </label>
            <label className="md:col-span-4 space-y-1">
              <span className="text-xs font-medium text-slate-700">وصف الفعالية</span>
              <textarea
                name="description"
                defaultValue={eventItem.description ?? ''}
                placeholder="وصف الفعالية"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                rows={2}
              />
            </label>
            <div className="md:col-span-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                صورة البانر
              </h3>
              {eventItem.imageUrl ? (
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="mb-2 text-xs font-medium text-slate-600">الصورة الحالية</p>
                  <img src={eventItem.imageUrl} alt="" className="h-36 w-full max-w-md rounded-lg border border-slate-200 object-cover shadow-inner" />
                  <p className="mt-2 text-xs text-slate-500">صورة جديدة تستبدل الحالية عند الحفظ.</p>
                </div>
              ) : null}
              <ImageUploader
                onSelect={(file) => {
                  setSelectedBannerFile(file)
                  setUploadError(null)
                }}
                onError={(error) => {
                  setUploadError(error)
                }}
              />
              {selectedBannerFile && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2">
                  <p className="text-xs font-medium text-emerald-900">تم اختيار صورة جديدة — تُرفع عند حفظ التعديلات.</p>
                </div>
              )}
            </div>
            <label className="md:col-span-4 space-y-1">
              <span className="text-xs font-medium text-slate-700">الروابط المرتبطة (JSON)</span>
              <textarea
                name="associatedUrls"
                defaultValue={eventItem.associatedUrls ? JSON.stringify(eventItem.associatedUrls, null, 2) : ''}
                placeholder={'الروابط المرتبطة (JSON، مثال: {"website": "https://...", "facebook": "https://..."}'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 sm:text-sm"
                rows={3}
              />
            </label>
          </form>
          {saveError ? <p className="mt-3 text-sm text-red-600">{saveError}</p> : null}
          {uploadError ? <p className="mt-3 text-sm text-red-600">{uploadError}</p> : null}
        </article>
      ) : null}
      {!isEditing && canEditEvent ? (
        <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 px-4 py-3 text-center text-sm text-slate-600">
          يمكنك تعديل تفاصيل الفعالية من زر <span className="font-medium text-slate-800">تعديل الفعالية</span> أعلاه.
        </div>
      ) : null}
      {!canEditEvent ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-sm text-slate-600">
          عرض للأعضاء. يمكن لمالك المشروع ومديريه تعديل الفعالية.
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
            <p className="text-xs font-medium text-slate-500">المكان</p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{eventItem.location ?? 'غير محدد'}</p>
          </div>
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-slate-900">معلومات إضافية</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <span className="text-slate-500">المنشئ</span>
            <p className="mt-1 font-mono text-sm font-medium text-slate-900">{eventItem.createdBy}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <span className="text-slate-500">سعة التذاكر</span>
            <p className="mt-1 font-semibold text-slate-900">{totalTicketCapacity} مقعد</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm sm:col-span-2">
            <span className="text-slate-500">المشروع</span>
            <p className="mt-1 font-medium text-slate-900">{project?.name ?? (eventItem.projectId ? 'جار التحميل...' : 'غير مرتبط بمشروع')}</p>
          </div>
        </div>
        {projectLoadError ? <p className="mt-3 text-sm text-red-600">تعذر تحميل معلومات المشروع المرتبط بهذه الفعالية.</p> : null}
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
          <ul className="mt-4 space-y-2">
            {Object.entries(eventItem.associatedUrls).map(([key, value]) => (
              <li
                key={key}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-slate-800">{key}</span>
                {typeof value === 'string' ? (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 break-all text-sm text-cyan-700 hover:text-cyan-800 hover:underline"
                  >
                    {value}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  </a>
                ) : (
                  <span className="text-sm text-slate-600">{String(value)}</span>
                )}
              </li>
            ))}
          </ul>
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
            <form onSubmit={handleCreateTicket} className="grid gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 md:grid-cols-5">
              <input
                name="name"
                placeholder="اسم التذكرة"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
              <input
                name="currencyPrice"
                placeholder="السعر النقدي (مثال: 10 USD)"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
              <input
                name="pointPrice"
                type="number"
                min={0}
                placeholder="النقاط"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
              <input
                name="quantity"
                type="number"
                min={0}
                placeholder="الكمية"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
              <button
                type="submit"
                disabled={isCreatingTicket}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingTicket ? 'جار الإضافة...' : 'إضافة تذكرة'}
              </button>
              <input
                name="description"
                placeholder="وصف التذكرة (اختياري)"
                className="md:col-span-5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
            </form>
          ) : (
            <p className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">إدارة التذاكر متاحة لمالك المشروع ومديريه.</p>
          )}
          {ticketError ? <p className="mt-3 text-sm text-red-600">{ticketError}</p> : null}

          <form onSubmit={handleApplyToEvent} className="mt-5 grid gap-3 rounded-xl border border-cyan-100 bg-cyan-50/30 p-4 md:grid-cols-4">
            <select
              name="ticketId"
              defaultValue=""
              className="md:col-span-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              disabled={isApplying || tickets.length === 0 || hasUserRegistered}
              required
            >
              <option value="">اختر نوع التذكرة</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.name} — {ticket.quantity} مقعد — {ticket.pointPrice} نقطة
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isApplying || tickets.length === 0 || hasUserRegistered}
              className="rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {hasUserRegistered ? 'مسجّل مسبقاً' : isApplying ? 'جار الإرسال...' : 'التقديم'}
            </button>
          </form>
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
                    {canEditEvent && editingTicketId === ticket.id ? (
                      <form
                        onSubmit={(e) => void handleUpdateTicket(e, ticket.id)}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <label className="space-y-1 sm:col-span-2">
                          <span className="text-xs font-medium text-slate-600">اسم التذكرة</span>
                          <input
                            name="name"
                            defaultValue={ticket.name}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">السعر النقدي</span>
                          <input
                            name="currencyPrice"
                            defaultValue={ticket.currencyPrice}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">النقاط</span>
                          <input
                            name="pointPrice"
                            type="number"
                            min={0}
                            defaultValue={ticket.pointPrice}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">الكمية</span>
                          <input
                            name="quantity"
                            type="number"
                            min={0}
                            defaultValue={ticket.quantity}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </label>
                        <label className="space-y-1 sm:col-span-2">
                          <span className="text-xs font-medium text-slate-600">الوصف (اختياري)</span>
                          <input
                            name="description"
                            defaultValue={ticket.description ?? ''}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </label>
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <button
                            type="submit"
                            disabled={updatingTicketId === ticket.id}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingTicketId === ticket.id ? 'جار الحفظ...' : 'حفظ التعديلات'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTicketId(null)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                          >
                            إلغاء
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">{ticket.name}</p>
                            {ticket.description ? (
                              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ticket.description}</p>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                            {ticket.currencyPrice}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          الكمية: {ticket.quantity} • النقاط: {ticket.pointPrice}
                        </p>
                        {canEditEvent ? (
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() => setEditingTicketId(ticket.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteTicket(ticket.id)}
                              disabled={deletingTicketId === ticket.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingTicketId === ticket.id ? 'جار الحذف...' : 'حذف'}
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">المسجّلون</h3>
              <ul className="space-y-2">
                {registrations.map((registration) => (
                  <li
                    key={registration.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <span className="font-mono text-sm text-slate-800">{registration.membershipNumber}</span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                      {registrationStatusLabel(registration.status)}
                    </span>
                  </li>
                ))}
              </ul>
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