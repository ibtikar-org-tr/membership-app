import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { createEvent, fetchEvents, fetchProjectById, fetchProjectMembers } from '../../api/vms'
import type { VmsEvent, VmsProject, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { formatDateTimeEnCA } from '../../utils/date-format'

export function DashboardProjectEventsPage() {
  const { projectID } = useParams()
  const user = getStoredUser()

  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [events, setEvents] = useState<VmsEvent[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)

  useEffect(() => {
    if (!projectID) {
      return
    }

    const currentProjectId = projectID
    const controller = new AbortController()

    async function loadPageData() {
      try {
        const [projectPayload, membersPayload, eventsPayload] = await Promise.all([
          fetchProjectById(currentProjectId, user?.membershipNumber),
          fetchProjectMembers(currentProjectId),
          fetchEvents(),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectMembers(membersPayload.projectMembers)
        setEvents(eventsPayload.events.filter((eventItem) => eventItem.projectId === currentProjectId))
        setHasError(false)
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setHasError(true)
        setNotFound(true)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadPageData()

    return () => {
      controller.abort()
    }
  }, [projectID])

  const managerMembershipNumbers = useMemo(
    () => new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber)),
    [projectMembers],
  )

  const canCreateEvents = useMemo(() => {
    if (!project || !user) {
      return false
    }

    const membershipNumber = user.membershipNumber
    return project.owner === membershipNumber || managerMembershipNumbers.has(membershipNumber)
  }, [project, managerMembershipNumbers, user])

  useEffect(() => {
    if (!canCreateEvents) {
      setIsCreateEventOpen(false)
      setCreateError(null)
    }
  }, [canCreateEvents])

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!projectID || !user) {
      setCreateError('يجب تسجيل الدخول أولاً.')
      return
    }

    if (!canCreateEvents) {
      setCreateError('إنشاء الفعالية متاح فقط لمالك المشروع ومديري المشروع.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const startTime = String(formData.get('startTime') ?? '').trim()
    const endTime = String(formData.get('endTime') ?? '').trim()
    const location = String(formData.get('location') ?? '').trim()

    if (!name) {
      setCreateError('يرجى إدخال اسم الفعالية.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createEvent({
        name,
        description: description || undefined,
        ...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
        ...(endTime ? { endTime: new Date(endTime).toISOString() } : {}),
        location: location || undefined,
        createdBy: user.membershipNumber,
        projectId: projectID,
      })

      setEvents((previous) => [payload.event, ...previous])
      form.reset()
      setIsCreateEventOpen(false)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء الفعالية.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (!projectID || notFound) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (isLoading || !project) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل فعاليات المشروع...</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">فعاليات المشروع</h2>
          <p className="mt-1 text-sm text-slate-500">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {events.length} فعالية
          </span>
          {canCreateEvents ? (
            <button
              type="button"
              onClick={() => setIsCreateEventOpen((previous) => !previous)}
              className="inline-flex items-center rounded-md border border-slate-300 bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              {isCreateEventOpen ? 'إغلاق إضافة فعالية' : 'إضافة فعالية'}
            </button>
          ) : null}
          <Link
            to={`/dashboard/projects/${project.id}`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة للمشروع
          </Link>
        </div>
      </div>

      {canCreateEvents && isCreateEventOpen ? (
        <form onSubmit={handleCreateEvent} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
          <input
            name="name"
            placeholder="اسم الفعالية"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            required
          />
          <input
            name="startTime"
            type="datetime-local"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
          <input
            name="endTime"
            type="datetime-local"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
          <input
            name="location"
            placeholder="الموقع"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isCreating ? 'جار الإضافة...' : 'إضافة فعالية'}
          </button>
          <textarea
            name="description"
            placeholder="وصف الفعالية"
            className="md:col-span-5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            rows={2}
          />
        </form>
      ) : canCreateEvents ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          اضغط زر إضافة فعالية لفتح نموذج الإنشاء.
        </p>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          إنشاء الفعاليات متاح فقط لمالك المشروع ومديري المشروع.
        </p>
      )}

      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

      <div className="mt-5 space-y-3">
        {hasError ? <p className="text-sm text-red-600">تعذر تحميل فعاليات المشروع.</p> : null}
        {!hasError && events.length === 0 ? <p className="text-sm text-slate-500">لا توجد فعاليات مرتبطة بهذا المشروع حالياً.</p> : null}

        {!hasError &&
          events.map((eventItem) => (
            <article key={eventItem.id} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">{eventItem.name}</p>
                <Link
                  to={`/dashboard/events/${eventItem.id}`}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  عرض الفعالية
                </Link>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <p>البداية: {formatDateTimeEnCA(eventItem.startTime)}</p>
                <p>النهاية: {formatDateTimeEnCA(eventItem.endTime)}</p>
                <p>المكان: {eventItem.location ?? 'غير محدد'}</p>
              </div>
            </article>
          ))}
      </div>
    </section>
  )
}
