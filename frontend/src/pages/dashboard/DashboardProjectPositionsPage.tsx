import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { createProjectPosition, fetchProjectById, fetchProjectMembers, fetchProjectPositions } from '../../api/vms'
import type { VmsPosition, VmsProject, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

export function DashboardProjectPositionsPage() {
  const { projectID } = useParams()
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])

  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [positions, setPositions] = useState<VmsPosition[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreatePositionOpen, setIsCreatePositionOpen] = useState(false)

  useEffect(() => {
    if (!projectID || !user) {
      return
    }

    const currentProjectId = projectID
    const currentUser = user
    const controller = new AbortController()

    async function loadPageData() {
      try {
        const [projectPayload, membersPayload, positionsPayload] = await Promise.all([
          fetchProjectById(currentProjectId, currentUser.membershipNumber),
          fetchProjectMembers(currentProjectId),
          fetchProjectPositions(currentProjectId, currentUser.membershipNumber),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectMembers(membersPayload.projectMembers)
        setPositions(positionsPayload.positions)
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
  }, [projectID, user])

  const managerMembershipNumbers = useMemo(
    () => new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber)),
    [projectMembers],
  )

  const canCreatePositions = useMemo(() => {
    if (!project || !user) {
      return false
    }

    const membershipNumber = user.membershipNumber
    return project.owner === membershipNumber || managerMembershipNumbers.has(membershipNumber)
  }, [project, managerMembershipNumbers, user])

  useEffect(() => {
    if (!canCreatePositions) {
      setIsCreatePositionOpen(false)
      setCreateError(null)
    }
  }, [canCreatePositions])

  const handleCreatePosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!projectID || !user) {
      setCreateError('يجب تسجيل الدخول أولاً.')
      return
    }

    if (!canCreatePositions) {
      setCreateError('إنشاء الفرص التطوعية متاح فقط لمالك المشروع ومديري المشروع.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()

    if (!name) {
      setCreateError('يرجى إدخال اسم الفرصة التطوعية.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createProjectPosition({
        projectId: projectID,
        name,
        status: 'closed',
        createdBy: user.membershipNumber,
      }, user.membershipNumber)

      setPositions((previous) => [payload.position, ...previous])
      form.reset()
      setIsCreatePositionOpen(false)
      navigate(`/dashboard/positions/${payload.position.id}/edit`)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء الفرصة التطوعية.')
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
        <p className="text-sm text-slate-500">جار تحميل الفرص التطوعية...</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الفرص التطوعية</h2>
          <p className="mt-1 text-sm text-slate-500">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {positions.length} فرصة
          </span>
          {canCreatePositions ? (
            <button
              type="button"
              onClick={() => setIsCreatePositionOpen((previous) => !previous)}
              className="inline-flex items-center rounded-md border border-slate-300 bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              {isCreatePositionOpen ? 'إغلاق إضافة فرصة' : 'إضافة فرصة'}
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

      {canCreatePositions && isCreatePositionOpen ? (
        <form onSubmit={handleCreatePosition} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
          <label className="space-y-1 md:col-span-4">
            <span className="text-xs font-medium text-slate-700">اسم الفرصة التطوعية</span>
            <input
              name="name"
              placeholder="اسم الفرصة التطوعية"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
          </label>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isCreating ? 'جار الإنشاء...' : 'إنشاء فرصة'}
          </button>
          <p className="text-xs text-slate-500 md:col-span-5">
            سيتم إنشاء الفرصة بحالة <span className="font-semibold">مغلقة</span> ثم تحويلك مباشرة إلى صفحة التعديل لإكمال التفاصيل.
          </p>
        </form>
      ) : canCreatePositions ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          اضغط زر إضافة فرصة لفتح نموذج الإنشاء.
        </p>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          إنشاء الفرص التطوعية متاح فقط لمالك المشروع ومديري المشروع.
        </p>
      )}

      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}

      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل الفرص التطوعية.</p> : null}
      {!hasError ? (
        <div className="mt-6 space-y-3">
          {positions.length === 0 ? (
            <p className="text-center text-sm text-slate-500">لا توجد فرص تطوعية مرتبطة بهذا المشروع حالياً.</p>
          ) : (
            positions.map((position) => (
              <Link
                key={position.id}
                to={`/dashboard/positions/${position.id}/edit`}
                className="block rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{position.name}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                      <span>{position.seats} مقاعد</span>
                      <span>{position.acceptedApplicationsCount} مقبولين</span>
                      <span>{position.applications.length} طلب</span>
                    </div>
                    {position.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{position.description}</p>
                    ) : null}
                  </div>
                  <span className="ml-3 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {position.status === 'open' && 'مفتوحة'}
                    {position.status === 'filled' && 'مكتملة'}
                    {position.status === 'closed' && 'مغلقة'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </section>
  )
}
