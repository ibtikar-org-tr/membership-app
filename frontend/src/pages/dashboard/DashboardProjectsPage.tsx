import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { FiChevronLeft, FiFolder, FiGitBranch, FiLayers } from 'react-icons/fi'
import { createProject, fetchProjects } from '../../api/vms'
import type { VmsProject } from '../../types/vms'
import { formatDateEnCA } from '../../utils/date-format'
import { getStoredUser, isPlatformAdmin } from '../../utils/auth'
import { ProjectHierarchyTree } from './ProjectHierarchyTree'
import { priorityTone, statusBadgeClass, statusLabel } from './project-details/helpers'

export function DashboardProjectsPage() {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const user = useMemo(() => getStoredUser(), [])

  const loadProjects = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setHasError(false)

    try {
      const payload = await fetchProjects(user?.membershipNumber)

      if (signal?.aborted) {
        return
      }

      setProjects(payload.projects)
    } catch {
      if (!signal?.aborted) {
        setHasError(true)
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [user?.membershipNumber])

  useEffect(() => {
    const controller = new AbortController()
    void loadProjects(controller.signal)

    return () => {
      controller.abort()
    }
  }, [loadProjects])

  const topLevelCount = useMemo(() => projects.filter((project) => !project.parentProjectId).length, [projects])

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) {
      map.set(project.id, project.name)
    }
    return map
  }, [projects])

  const sortedProjects = useMemo(() => {
    return [...projects].sort((left, right) => {
      if (Boolean(left.parentProjectId) !== Boolean(right.parentProjectId)) {
        return left.parentProjectId ? 1 : -1
      }

      return left.name.localeCompare(right.name, 'ar')
    })
  }, [projects])

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!user) {
      setCreateError('يجب تسجيل الدخول أولاً.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const parentProjectIdRaw = String(formData.get('parentProjectId') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'active').trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'

    if (!name) {
      setCreateError('يرجى إدخال اسم المشروع.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createProject(
        {
          name,
          description: description || undefined,
          parentProjectId: parentProjectIdRaw || undefined,
          owner: user.membershipNumber,
          status,
        },
        user.membershipNumber,
      )

      setProjects((previous) => [payload.project, ...previous])
      event.currentTarget.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء المشروع.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="bg-linear-to-l from-slate-950 via-slate-900 to-cyan-950 px-4 py-5 text-white sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-100/80">إدارة المشاريع</p>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <FiFolder className="h-5 w-5 text-cyan-100" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-semibold sm:text-2xl">المشاريع</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                    نظرة على المشاريع الحالية، إنشاء مشاريع جديدة، والانتقال السريع إلى تفاصيل كل مشروع.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3 lg:w-auto lg:max-w-none">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-medium text-cyan-100/80 sm:text-xs">الإجمالي</p>
                <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{projects.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-medium text-cyan-100/80 sm:text-xs">رئيسية</p>
                <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{topLevelCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-medium text-cyan-100/80 sm:text-xs">فرعية</p>
                <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{projects.length - topLevelCount}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isPlatformAdmin(user) ? (
        <section className="rounded-3xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,#f8fafc,#eef2ff_55%,#e2e8f0)] p-4 shadow-sm sm:p-6">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <FiLayers className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">مشروع جديد (مسؤول)</h3>
                <p className="text-xs text-slate-500">إنشاء مشاريع رئيسية أو ربط مشروع بمشروع أب موجود. يظهر هذا النموذج للمسؤولين فقط.</p>
              </div>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5 md:col-span-1">
                <span className="text-xs font-medium text-slate-600">اسم المشروع</span>
                <input
                  name="name"
                  placeholder="مثال: حملة التوعية الصحية"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                  required
                />
              </label>
              <label className="block space-y-1.5 md:col-span-1">
                <span className="text-xs font-medium text-slate-600">وصف مختصر</span>
                <input
                  name="description"
                  placeholder="اختياري — سطر أو سطران"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-600">المشروع الأب</span>
                <select
                  name="parentProjectId"
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                >
                  <option value="">بدون — مشروع رئيسي</option>
                  {projects.map((projectItem) => (
                    <option key={projectItem.id} value={projectItem.id}>
                      {projectItem.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-600">الحالة</span>
                <select
                  name="status"
                  defaultValue="active"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                >
                  <option value="active">نشط</option>
                  <option value="completed">مكتمل</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </label>
              <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center md:justify-between">
                {createError ? <p className="text-sm text-red-600">{createError}</p> : <span className="hidden text-xs text-slate-400 md:inline">سيتم ربط المشروع بحسابك كمالك.</span>}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500 md:ms-auto md:w-auto"
                >
                  {isCreating ? 'جار الإضافة...' : 'إضافة المشروع'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-amber-950">إنشاء مشروع رئيسي</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/85">
            إضافة مشاريع بدون مشروع أب متاحة للمسؤولين فقط. لإضافة مشروع فرعي لمبادرتك، افتح صفحة المشروع ثم اختر «المشاريع الفرعية».
          </p>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <FiGitBranch className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">قائمة المشاريع</h3>
              <p className="mt-0.5 text-sm text-slate-500">بطاقات سريعة مع الحالة وآخر تحديث.</p>
            </div>
          </div>
          {!isLoading && !hasError ? (
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {projects.length} مشروع
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <div
                  key={`project-skeleton-${key}`}
                  className="flex overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80"
                >
                  <div className="w-1 shrink-0 bg-slate-200" />
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-4 w-3/4 max-w-48 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-3 w-full animate-pulse rounded-md bg-slate-100" />
                    <div className="mt-auto h-8 w-full animate-pulse rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && hasError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-5 text-center">
              <p className="text-sm font-medium text-red-800">تعذر تحميل المشاريع.</p>
              <p className="mt-1 text-xs text-red-700/90">تحقق من الاتصال ثم أعد المحاولة.</p>
              <button
                type="button"
                onClick={() => void loadProjects()}
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : null}

          {!isLoading && !hasError && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                <FiFolder className="h-7 w-7" aria-hidden />
              </span>
              <p className="mt-4 text-sm font-medium text-slate-800">لا توجد مشاريع بعد</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">ابدأ بإنشاء أول مشروع باستخدام النموذج أعلاه، أو انتظر حتى يضيف فريقك مشاريع جديدة.</p>
            </div>
          ) : null}

          {!isLoading && !hasError && projects.length > 0 ? (
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProjects.map((project) => {
                const parentName = project.parentProjectId ? projectNameById.get(project.parentProjectId) : null

                return (
                  <li key={project.id}>
                    <article className="group flex h-full min-h-46 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-cyan-200/80 hover:shadow-md">
                      <div className={`w-1 shrink-0 ${priorityTone(project.status)}`} aria-hidden />
                      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(project.status)}`}>
                            {statusLabel(project.status)}
                          </span>
                          {project.parentProjectId ? (
                            <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600" title={parentName ?? project.parentProjectId}>
                              <FiGitBranch className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                              <span className="truncate">{parentName ? `تحت: ${parentName}` : 'مشروع فرعي'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50/80 px-2 py-0.5 text-[11px] font-medium text-cyan-800">مشروع رئيسي</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold leading-snug text-slate-900">{project.name}</h4>
                          {project.description ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{project.description}</p>
                          ) : (
                            <p className="mt-1 text-xs italic text-slate-400">لا يوجد وصف</p>
                          )}
                        </div>
                        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate">
                              <span className="text-slate-400">المسؤول:</span> {project.owner}
                            </p>
                            <p>
                              <span className="text-slate-400">آخر تحديث:</span> {formatDateEnCA(project.updatedAt)}
                            </p>
                          </div>
                          <Link
                            to={`/dashboard/projects/${project.id}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 transition group-hover:border-cyan-300 group-hover:bg-cyan-50/80 group-hover:text-cyan-950"
                          >
                            التفاصيل
                            <FiChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </section>

      <ProjectHierarchyTree />
    </div>
  )
}
