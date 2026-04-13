import { Link, Navigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft, FiFolder, FiGitBranch, FiLayers } from 'react-icons/fi'
import { createProject, fetchProjectById, fetchProjectMembers, fetchProjects } from '../../api/vms'
import type { VmsProject, VmsProjectMember } from '../../types/vms'
import { formatDateEnCA } from '../../utils/date-format'
import { getStoredUser } from '../../utils/auth'
import { priorityTone, statusBadgeClass, statusLabel } from './project-details/helpers'

export function DashboardProjectSubProjectsPage() {
  const { projectID } = useParams()
  const user = useMemo(() => getStoredUser(), [])

  const [parentProject, setParentProject] = useState<VmsProject | null>(null)
  const [allProjects, setAllProjects] = useState<VmsProject[]>([])
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectID || !user) {
      return
    }

    const currentProjectId = projectID
    const membershipNumber = user.membershipNumber
    const controller = new AbortController()

    async function load() {
      try {
        const [projectPayload, projectsPayload, membersPayload] = await Promise.all([
          fetchProjectById(currentProjectId, membershipNumber),
          fetchProjects(membershipNumber),
          fetchProjectMembers(currentProjectId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setParentProject(projectPayload.project)
        setAllProjects(projectsPayload.projects)
        setProjectMembers(membersPayload.projectMembers)
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

    void load()

    return () => {
      controller.abort()
    }
  }, [projectID, user?.membershipNumber])

  const childProjects = useMemo(() => {
    if (!projectID) {
      return []
    }

    return allProjects
      .filter((project) => project.parentProjectId === projectID)
      .sort((left, right) => left.name.localeCompare(right.name, 'ar'))
  }, [allProjects, projectID])

  const canManageSubProjects = useMemo(() => {
    if (!user || !parentProject) {
      return false
    }

    if (parentProject.owner === user.membershipNumber) {
      return true
    }

    return projectMembers.some(
      (member) => member.membershipNumber === user.membershipNumber && member.role === 'manager',
    )
  }, [parentProject, projectMembers, user])

  const handleCreateChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!projectID || !user) {
      return
    }

    if (!canManageSubProjects) {
      setCreateError('ليست لديك صلاحية إضافة مشروع فرعي.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'active').trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'

    if (!name) {
      setCreateError('يرجى إدخال اسم المشروع الفرعي.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createProject(
        {
          name,
          description: description || undefined,
          parentProjectId: projectID,
          owner: user.membershipNumber,
          status,
        },
        user.membershipNumber,
      )

      setAllProjects((previous) => [payload.project, ...previous])
      event.currentTarget.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء المشروع الفرعي.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (!projectID || !user) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (!isLoading && notFound) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (isLoading || !parentProject) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">جار تحميل المشاريع الفرعية...</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="bg-linear-to-l from-slate-950 via-slate-900 to-cyan-950 px-4 py-5 text-white sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-100/80">مشاريع فرعية</p>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <FiGitBranch className="h-5 w-5 text-cyan-100" aria-hidden />
                </span>
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">{parentProject.name}</h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                    المشاريع التابعة لهذا المشروع. يمكن لمالك المشروع أو المدراء إضافة مشاريع فرعية جديدة.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                to={`/dashboard/projects/${parentProject.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                لوحة المشروع
              </Link>
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                كل المشاريع
              </Link>
            </div>
          </div>
        </div>
      </header>

      {canManageSubProjects ? (
        <section className="rounded-3xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,#f8fafc,#eef2ff_55%,#e2e8f0)] p-4 shadow-sm sm:p-6">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <FiLayers className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">إضافة مشروع فرعي</h2>
                <p className="text-xs text-slate-500">يُربط تلقائياً بالمشروع الحالي كمشروع أب.</p>
              </div>
            </div>

            <form onSubmit={handleCreateChild} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5 md:col-span-1">
                <span className="text-xs font-medium text-slate-600">اسم المشروع الفرعي</span>
                <input
                  name="name"
                  placeholder="اسم المشروع"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  required
                />
              </label>
              <label className="block space-y-1.5 md:col-span-1">
                <span className="text-xs font-medium text-slate-600">وصف مختصر</span>
                <input
                  name="description"
                  placeholder="اختياري"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-slate-600">الحالة</span>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                >
                  <option value="active">نشط</option>
                  <option value="completed">مكتمل</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </label>
              <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center md:justify-between">
                {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500 md:ms-auto md:w-auto"
                >
                  {isCreating ? 'جار الإضافة...' : 'إضافة المشروع الفرعي'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 sm:p-5">
          يمكن لمالك المشروع أو المدراء فقط إضافة مشاريع فرعية. لديك صلاحية العرض فقط.
        </section>
      )}

      <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <FiFolder className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">المشاريع الفرعية</h2>
              <p className="mt-0.5 text-sm text-slate-500">كل المشاريع التي يكون مشروعك الحالي أباً لها.</p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {childProjects.length} مشروع
          </span>
        </div>

        <div className="mt-5">
          {childProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">لا توجد مشاريع فرعية بعد</p>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                {canManageSubProjects
                  ? 'استخدم النموذج أعلاه لإضافة أول مشروع فرعي.'
                  : 'سيظهر هنا أي مشروع فرعي يضيفه المالك أو المدراء.'}
              </p>
            </div>
          ) : (
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {childProjects.map((project) => (
                <li key={project.id}>
                  <article className="group flex h-full min-h-46 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-cyan-200/80 hover:shadow-md">
                    <div className={`w-1 shrink-0 ${priorityTone(project.status)}`} aria-hidden />
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                      <span className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(project.status)}`}>
                        {statusLabel(project.status)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold leading-snug text-slate-900">{project.name}</h3>
                        {project.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{project.description}</p>
                        ) : (
                          <p className="mt-1 text-xs italic text-slate-400">لا يوجد وصف</p>
                        )}
                      </div>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                        <p>
                          <span className="text-slate-400">آخر تحديث:</span> {formatDateEnCA(project.updatedAt)}
                        </p>
                        <Link
                          to={`/dashboard/projects/${project.id}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 transition group-hover:border-cyan-300 group-hover:bg-cyan-50/80"
                        >
                          التفاصيل
                          <FiChevronLeft className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
