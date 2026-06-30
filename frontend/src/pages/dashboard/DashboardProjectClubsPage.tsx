import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { createClub, fetchClubs, fetchProjectById, fetchProjectMembers } from '../../api/vms'
import type { VmsClub, VmsProject, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { SkillsField } from '../../components/SkillsField'

const VISIBILITY_LABEL: Record<string, string> = {
  public: 'عام',
  private: 'خاص',
  draft: 'مسودة',
}

const JOIN_POLICY_LABEL: Record<string, string> = {
  auto_approve: 'دخول مباشر',
  request_to_join: 'طلب انضمام',
  invite_only: 'بدعوة فقط',
}

export function DashboardProjectClubsPage() {
  const { projectID } = useParams()
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])

  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [clubs, setClubs] = useState<VmsClub[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false)
  const [clubSkills, setClubSkills] = useState('')

  useEffect(() => {
    if (!projectID) {
      return
    }

    const currentProjectId = projectID
    const controller = new AbortController()

    async function loadPageData() {
      try {
        const [projectPayload, membersPayload, clubsPayload] = await Promise.all([
          fetchProjectById(currentProjectId, user?.membershipNumber),
          fetchProjectMembers(currentProjectId),
          fetchClubs(currentProjectId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectMembers(membersPayload.projectMembers)
        setClubs(clubsPayload.clubs)
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

    void loadPageData()

    return () => {
      controller.abort()
    }
  }, [projectID, user?.membershipNumber])

  const managerMembershipNumbers = useMemo(
    () => new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber)),
    [projectMembers],
  )

  const canCreateClubs = useMemo(() => {
    if (!project || !user) {
      return false
    }

    const membershipNumber = user.membershipNumber
    return project.owner === membershipNumber || managerMembershipNumbers.has(membershipNumber)
  }, [project, managerMembershipNumbers, user])

  useEffect(() => {
    if (!canCreateClubs) {
      setIsCreateClubOpen(false)
      setCreateError(null)
    }
  }, [canCreateClubs])

  const handleCreateClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!projectID || !user) {
      setCreateError('يجب تسجيل الدخول أولاً.')
      return
    }

    if (!canCreateClubs) {
      setCreateError('إنشاء النادي متاح فقط لمالك المشروع ومديري المشروع.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
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
      setCreateError('يرجى إدخال اسم النادي.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createClub(
        {
          name,
          projectId: projectID,
          visibility: 'draft',
          joinPolicy: 'request_to_join',
          ...(skills ? { skills } : {}),
        },
        user.membershipNumber,
      )

      setClubs((previous) => [payload.club, ...previous])
      form.reset()
      setClubSkills('')
      setIsCreateClubOpen(false)
      navigate(`/clubs/${payload.club.id}/edit`)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء النادي.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  if (!projectID || notFound) {
    return <Navigate to="/projects" replace />
  }

  if (isLoading || !project) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل أندية المشروع...</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">أندية المشروع</h2>
          <p className="mt-1 text-sm text-slate-500">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {clubs.length} نادي
          </span>
          {canCreateClubs ? (
            <button
              type="button"
              onClick={() => setIsCreateClubOpen((previous) => !previous)}
              className="inline-flex items-center rounded-md border border-slate-300 bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              {isCreateClubOpen ? 'إغلاق إضافة نادي' : 'إضافة نادي'}
            </button>
          ) : null}
          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة للمشروع
          </Link>
        </div>
      </div>

      {canCreateClubs && isCreateClubOpen ? (
        <form onSubmit={handleCreateClub} className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-5">
          <label className="space-y-1 md:col-span-4">
            <span className="text-xs font-medium text-slate-700">اسم النادي</span>
            <input
              name="name"
              placeholder="اسم النادي"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
          </label>
          <div className="md:col-span-5">
            <SkillsField
              id="create-club-skills"
              label="المهارات المرتبطة بالنادي"
              value={clubSkills}
              onChange={setClubSkills}
              placeholder="ابحث عن مهارة أو أضف مهارة جديدة"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isCreating ? 'جار إنشاء المسودة...' : 'إنشاء مسودة'}
          </button>
          <p className="text-xs text-slate-500 md:col-span-5">
            سيتم إنشاء النادي بحالة <span className="font-semibold">مسودة</span> ثم تحويلك مباشرة إلى صفحة التعديل لإكمال التفاصيل.
          </p>
        </form>
      ) : canCreateClubs ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          اضغط زر إضافة نادي لفتح نموذج الإنشاء.
        </p>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          إنشاء الأندية متاح فقط لمالك المشروع ومديري المشروع.
        </p>
      )}

      {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}
      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل أندية المشروع.</p> : null}

      {!hasError ? (
        clubs.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">لا توجد أندية مرتبطة بهذا المشروع حالياً.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <li key={club.id}>
                <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
                  {club.imageUrl ? (
                    <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-slate-100">
                      <img src={club.imageUrl} alt={club.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{club.name}</h3>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                      {VISIBILITY_LABEL[club.visibility] ?? club.visibility}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {club.country ? (
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700">
                        {club.country}
                      </span>
                    ) : null}
                    {club.region ? (
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        {club.region}
                      </span>
                    ) : null}
                    {club.address === 'online' ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        أون لاين
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{JOIN_POLICY_LABEL[club.joinPolicy] ?? club.joinPolicy}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{club.description ?? 'لا يوجد وصف.'}</p>
                  <div className="mt-3 text-left">
                    <Link
                      to={`/clubs/${club.id}`}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}
