import { Link, Navigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createEventRegistration,
  createEventTicket,
  fetchEventById,
  fetchEventRegistrations,
  fetchEventTickets,
  fetchProjectById,
  fetchProjectMembers,
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
  const user = getStoredUser()
  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [tickets, setTickets] = useState<VmsEventTicket[]>([])
  const [registrations, setRegistrations] = useState<VmsEventRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [ticketError, setTicketError] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)
  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [projectLoadError, setProjectLoadError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

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
    const imageUrlsRaw = String(formData.get('imageUrls') ?? '').trim()
    const associatedUrlsRaw = String(formData.get('associatedUrls') ?? '').trim()

    if (!name) {
      setSaveError('يرجى إدخال اسم الفعالية.')
      return
    }

    let imageUrls: Record<string, unknown> | undefined
    let associatedUrls: Record<string, unknown> | undefined

    if (imageUrlsRaw) {
      try {
        imageUrls = JSON.parse(imageUrlsRaw)
        if (typeof imageUrls !== 'object' || Array.isArray(imageUrls)) {
          setSaveError('صيغة روابط الصور غير صحيحة. يجب أن تكون كائن JSON.')
          return
        }
      } catch {
        setSaveError('صيغة روابط الصور غير صحيحة. يجب أن تكون JSON صحيح.')
        return
      }
    }

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
        ...(imageUrls ? { imageUrls } : {}),
        ...(associatedUrls ? { associatedUrls } : {}),
      })

      setEventItem(payload.event)
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
      event.currentTarget.reset()
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
      event.currentTarget.reset()
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
          <div className="flex items-center gap-2">
            {canEditEvent ? (
              <button
                type="button"
                onClick={() => setIsEditing((previous) => !previous)}
                className="inline-flex items-center rounded-md border border-slate-300 bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
              >
                {isEditing ? 'إلغاء التعديل' : 'تعديل الفعالية'}
              </button>
            ) : null}
            <Link
              to="/dashboard/events"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              العودة للفعاليات
            </Link>
          </div>
        </div>
      </header>

      {isEditing && canEditEvent ? (
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">تعديل الفعالية</p>
          <form onSubmit={handleUpdateEvent} className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              name="name"
              defaultValue={eventItem.name}
              placeholder="اسم الفعالية"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
            <input
              name="startTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(eventItem.startTime)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
            <input
              name="endTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(eventItem.endTime)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isSaving ? 'جار الحفظ...' : 'حفظ التعديلات'}
            </button>
            <input
              name="location"
              defaultValue={eventItem.location ?? ''}
              placeholder="الموقع"
              className="md:col-span-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
            <textarea
              name="description"
              defaultValue={eventItem.description ?? ''}
              placeholder="وصف الفعالية"
              className="md:col-span-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              rows={2}
            />
            <textarea
              name="imageUrls"
              defaultValue={eventItem.imageUrls ? JSON.stringify(eventItem.imageUrls, null, 2) : ''}
              placeholder={'روابط الصور (JSON، مثال: {"banner": "https://...", "gallery": ["https://...", "https://..."]}'}
              className="md:col-span-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              rows={2}
            />
            <textarea
              name="associatedUrls"
              defaultValue={eventItem.associatedUrls ? JSON.stringify(eventItem.associatedUrls, null, 2) : ''}
              placeholder={'الروابط المرتبطة (JSON، مثال: {"website": "https://...", "facebook": "https://..."}'}
              className="md:col-span-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              rows={2}
            />
          </form>
          {saveError ? <p className="mt-2 text-sm text-red-600">{saveError}</p> : null}
        </article>
      ) : null}
      {!isEditing && canEditEvent ? (
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          يمكنك الضغط على زر "تعديل الفعالية" لتعديل تفاصيل الفعالية.
        </article>
      ) : null}
      {!canEditEvent ? (
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          هذه الصفحة تعرض جميع المعلومات المتاحة للأعضاء. يمكن لمالك المشروع ومديريه تعديل الفعالية.
        </article>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">البداية</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTimeEnCA(eventItem.startTime)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">النهاية</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTimeEnCA(eventItem.endTime)}</p>
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
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">المشروع: {project?.name ?? (eventItem.projectId ? 'جار التحميل...' : 'غير مرتبط بمشروع')}</p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">الموقع: {eventItem.location ?? 'غير محدد'}</p>
        </div>
        {projectLoadError ? <p className="mt-3 text-sm text-red-600">تعذر تحميل معلومات المشروع المرتبط بهذه الفعالية.</p> : null}
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

      {eventItem.imageUrls && Object.keys(eventItem.imageUrls).length > 0 ? (
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">روابط الصور</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {Object.entries(eventItem.imageUrls).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium text-slate-900">{key}:</span>
                {typeof value === 'string' ? (
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                    {value}
                  </a>
                ) : Array.isArray(value) ? (
                  <div className="flex flex-col gap-1">
                    {value.map((url, idx) => (
                      <a key={idx} href={String(url)} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                        {String(url)}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {eventItem.associatedUrls && Object.keys(eventItem.associatedUrls).length > 0 ? (
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900">الروابط المرتبطة</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {Object.entries(eventItem.associatedUrls).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium text-slate-900">{key}:</span>
                {typeof value === 'string' ? (
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                    {value}
                  </a>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">التذاكر والتسجيلات</p>
        {canEditEvent ? (
          <form onSubmit={handleCreateTicket} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
            <input
              name="name"
              placeholder="اسم التذكرة"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
            <input
              name="currencyPrice"
              placeholder="السعر النقدي (مثال: 10 USD)"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
            <input
              name="pointPrice"
              type="number"
              min={0}
              placeholder="النقاط"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
            <input
              name="quantity"
              type="number"
              min={0}
              placeholder="الكمية"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
            <button
              type="submit"
              disabled={isCreatingTicket}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isCreatingTicket ? 'جار إضافة التذكرة...' : 'إضافة تذكرة'}
            </button>
            <input
              name="description"
              placeholder="وصف التذكرة (اختياري)"
              className="md:col-span-5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
          </form>
        ) : (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            إدارة التذاكر مقصورة على مالك المشروع ومديريه.
          </p>
        )}
        {ticketError ? <p className="mt-2 text-sm text-red-600">{ticketError}</p> : null}

        <form onSubmit={handleApplyToEvent} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-4">
          <select
            name="ticketId"
            defaultValue=""
            className="md:col-span-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            disabled={isApplying || tickets.length === 0 || hasUserRegistered}
            required
          >
            <option value="">اختر نوع التذكرة</option>
            {tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.name} - {ticket.quantity} مقعد - {ticket.pointPrice} نقطة
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isApplying || tickets.length === 0 || hasUserRegistered}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {hasUserRegistered ? 'تم التسجيل مسبقاً' : isApplying ? 'جار الإرسال...' : 'التقديم على الفعالية'}
          </button>
        </form>
        {applyError ? <p className="mt-2 text-sm text-red-600">{applyError}</p> : null}
        {applySuccess ? <p className="mt-2 text-sm text-green-700">{applySuccess}</p> : null}

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