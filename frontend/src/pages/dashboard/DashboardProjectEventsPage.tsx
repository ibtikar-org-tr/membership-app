import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { createEvent, fetchEvents, fetchProjectById, fetchProjectMembers, uploadEventBanner } from '../../api/vms'
import type { VmsEvent, VmsProject, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { formatDateTimeEnCA } from '../../utils/date-format'
import { ImageUploader } from '../../components/ImageUploader'

export function DashboardProjectEventsPage() {
  const { projectID } = useParams()
  const user = useMemo(() => getStoredUser(), [])

  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [events, setEvents] = useState<VmsEvent[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

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
    const associatedUrlsRaw = String(formData.get('associatedUrls') ?? '').trim()

    if (!name) {
      setCreateError('يرجى إدخال اسم الفعالية.')
      return
    }

    let associatedUrls: Record<string, unknown> | undefined

    if (associatedUrlsRaw) {
      try {
        associatedUrls = JSON.parse(associatedUrlsRaw)
        if (typeof associatedUrls !== 'object' || Array.isArray(associatedUrls)) {
          setCreateError('صيغة الروابط المرتبطة غير صحيحة. يجب أن تكون كائن JSON.')
          return
        }
      } catch {
        setCreateError('صيغة الروابط المرتبطة غير صحيحة. يجب أن تكون JSON صحيح.')
        return
      }
    }

    setIsCreating(true)

    try {
      const payload = await createEvent({
        name,
        description: description || undefined,
        ...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
        ...(endTime ? { endTime: new Date(endTime).toISOString() } : {}),
        location: location || undefined,
        ...(associatedUrls ? { associatedUrls } : {}),
        createdBy: user.membershipNumber,
        projectId: projectID,
      })

      let createdEvent = payload.event

      if (selectedBannerFile) {
        const bannerPayload = await uploadEventBanner(createdEvent.id, selectedBannerFile)
        createdEvent = bannerPayload.event
      }

      setEvents((previous) => [createdEvent, ...previous])
      form.reset()
      setSelectedBannerFile(null)
      setUploadError(null)
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
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">اسم الفعالية</span>
            <input
              name="name"
              placeholder="اسم الفعالية"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">وقت البداية</span>
            <input
              name="startTime"
              type="datetime-local"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">وقت النهاية</span>
            <input
              name="endTime"
              type="datetime-local"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">الموقع</span>
            <input
              name="location"
              placeholder="الموقع"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
          </label>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isCreating ? 'جار الإضافة...' : 'إضافة فعالية'}
          </button>
          <label className="md:col-span-5 space-y-1">
            <span className="text-xs font-medium text-slate-700">وصف الفعالية</span>
            <textarea
              name="description"
              placeholder="وصف الفعالية"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              rows={2}
            />
          </label>
          <div className="md:col-span-5">
            <h3 className="mb-2 text-sm font-medium text-slate-700">صور الفعالية</h3>
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
              <div className="mt-2 rounded-md bg-green-50 p-2">
                <p className="text-xs font-medium text-green-800">تم اختيار صورة البانر. سيتم رفعها عند حفظ الفعالية.</p>
              </div>
            )}
          </div>
          <label className="md:col-span-5 space-y-1">
            <span className="text-xs font-medium text-slate-700">الروابط المرتبطة (JSON)</span>
            <textarea
              name="associatedUrls"
              placeholder={'الروابط المرتبطة (JSON، مثال: {"website": "https://...", "facebook": "https://..."}'}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              rows={2}
            />
          </label>
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
      {uploadError ? <p className="mt-2 text-sm text-red-600">{uploadError}</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hasError ? <p className="col-span-full text-center text-sm text-red-600">تعذر تحميل فعاليات المشروع.</p> : null}
        {!hasError && events.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-500">لا توجد فعاليات مرتبطة بهذا المشروع حالياً.</p>
        ) : null}

        {!hasError &&
          events.map((eventItem) => (
            <article
              key={eventItem.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              {eventItem.imageUrl ? (
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={eventItem.imageUrl}
                    alt={eventItem.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100">
                  <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900 line-clamp-2">{eventItem.name}</h3>
                {eventItem.description ? (
                  <p className="mb-3 text-xs text-slate-600 line-clamp-2">{eventItem.description}</p>
                ) : null}
                <div className="space-y-1.5 text-xs text-slate-600">
                  {eventItem.startTime && (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>البداية: {formatDateTimeEnCA(eventItem.startTime)}</span>
                    </div>
                  )}
                  {eventItem.endTime && (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>النهاية: {formatDateTimeEnCA(eventItem.endTime)}</span>
                    </div>
                  )}
                  {eventItem.location && (
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{eventItem.location}</span>
                    </div>
                  )}
                </div>
                <Link
                  to={`/dashboard/event/${eventItem.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  عرض التفاصيل
                  <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
      </div>
    </section>
  )
}
