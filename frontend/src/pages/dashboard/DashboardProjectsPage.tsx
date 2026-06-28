import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { FiFolder, FiGitBranch, FiLayers } from 'react-icons/fi'
import { createProject, fetchDirectProjects } from '../../api/vms'
import type { VmsProject } from '../../types/vms'
import { getStoredUser, isPlatformAdmin } from '../../utils/auth'
import { ProjectHierarchyTree } from './ProjectHierarchyTree'
import { ProjectsLinearTreeList, ProjectsLinearTreeSkeleton } from '../../components/dashboard/projects/ProjectsLinearTreeList'
import { SkillsField } from '../../components/SkillsField'

export function DashboardProjectsPage() {
  const [projects, setProjects] = useState<VmsProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [projectSkills, setProjectSkills] = useState('')

  const user = useMemo(() => getStoredUser(), [])

  const loadProjects = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setHasError(false)

    try {
      const payload = await fetchDirectProjects(user?.membershipNumber)

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
    const telegramGroupId = String(formData.get('telegramGroupId') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? 'active').trim()
    const status = statusRaw === 'completed' || statusRaw === 'archived' ? statusRaw : 'active'
    const skillsRaw = String(formData.get('skills') ?? '').trim()
    let skills
    if (skillsRaw) {
      try {
        const parsed = JSON.parse(skillsRaw)
        skills = typeof parsed === 'object' && parsed !== null ? parsed : undefined
      } catch {
        skills = Object.fromEntries(
          skillsRaw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => [item, 'required']),
        )
      }
    }

    if (!name) {
      setCreateError('يرجى إدخال اسم المشروع.')
      return
    }

    setIsCreating(true)

    const form = event.currentTarget

    try {
      const payload = await createProject(
        {
          name,
          description: description || undefined,
          parentProjectId: parentProjectIdRaw || undefined,
          owner: user.membershipNumber,
          ...(telegramGroupId ? { telegramGroupId } : {}),
          status,
          ...(skills ? { skills } : {}),
        },
        user.membershipNumber,
      )

      setProjects((previous) => [payload.project, ...previous])
      form.reset()
      setProjectSkills('')
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

      {isPlatformAdmin(user) && 
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
              <label className="block space-y-1.5 md:col-span-1">
                <span className="text-xs font-medium text-slate-600">معرّف مجموعة تلغرام</span>
                <input
                  name="telegramGroupId"
                  placeholder="مثال: -1001234567890"
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
              <div className="md:col-span-2">
                <SkillsField
                  id="create-project-skills"
                  label="المهارات المرتبطة بالمشروع"
                  value={projectSkills}
                  onChange={setProjectSkills}
                  placeholder="ابحث عن مهارة أو أضف مهارة جديدة"
                />
              </div>
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
      }

      <ProjectHierarchyTree clickableProjectIds={projects.map((project) => project.id)} />

      <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
              <FiGitBranch className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">قائمة المشاريع</h3>
              <p className="mt-0.5 text-sm text-slate-500">عرض خطي هرمي للمشاريع التي أنت عضوٌ فيها أو مسؤولٌ عنها.</p>
            </div>
          </div>
          {!isLoading && !hasError ? (
            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {projects.length} مشروع
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          {isLoading ? <ProjectsLinearTreeSkeleton /> : null}

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
              <p className="mt-4 text-sm font-medium text-slate-800">ليس هناك أي مشاريع أنت متطوّعٌ فيها </p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">يمكنك التطوّع في مشاريع جديدة من خلال قسم التطوّع.</p>
            </div>
          ) : null}

          {!isLoading && !hasError && projects.length > 0 ? <ProjectsLinearTreeList projects={projects} /> : null}
        </div>
      </section>
    </div>
  )
}
