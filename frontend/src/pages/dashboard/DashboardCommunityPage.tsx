import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createClub,
  createClubMember,
  deleteClub,
  deleteClubMember,
  fetchClubMembers,
  fetchClubs,
  fetchDirectProjects,
  fetchProjectMembers,
  updateClubMember,
} from '../../api/vms'
import type { VmsClub, VmsClubMember, VmsProject, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

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

const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: 'نشط',
  pending: 'بانتظار الموافقة',
  rejected: 'مرفوض',
}

export function DashboardCommunityPage() {
  const user = useMemo(() => getStoredUser(), [])

  const [projects, setProjects] = useState<VmsProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])

  const [clubs, setClubs] = useState<VmsClub[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [clubMembers, setClubMembers] = useState<VmsClubMember[]>([])

  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const [isCreatingClub, setIsCreatingClub] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadProjects() {
      if (!user?.membershipNumber) {
        setIsLoadingProjects(false)
        return
      }

      setIsLoadingProjects(true)

      try {
        const payload = await fetchDirectProjects(user.membershipNumber)
        if (!isActive) {
          return
        }

        setProjects(payload.projects)
        setSelectedProjectId((current) => current || payload.projects[0]?.id || '')
      } catch {
        if (isActive) {
          setProjects([])
        }
      } finally {
        if (isActive) {
          setIsLoadingProjects(false)
        }
      }
    }

    void loadProjects()

    return () => {
      isActive = false
    }
  }, [user?.membershipNumber])

  useEffect(() => {
    let isActive = true

    async function loadProjectData() {
      if (!selectedProjectId) {
        setClubs([])
        setProjectMembers([])
        setSelectedClubId('')
        return
      }

      setIsLoadingClubs(true)

      try {
        const [clubsPayload, membersPayload] = await Promise.all([
          fetchClubs(selectedProjectId),
          fetchProjectMembers(selectedProjectId),
        ])

        if (!isActive) {
          return
        }

        setClubs(clubsPayload.clubs)
        setProjectMembers(membersPayload.projectMembers)
        setSelectedClubId((current) => {
          if (current && clubsPayload.clubs.some((club) => club.id === current)) {
            return current
          }

          return clubsPayload.clubs[0]?.id || ''
        })
      } catch {
        if (isActive) {
          setClubs([])
          setProjectMembers([])
          setSelectedClubId('')
        }
      } finally {
        if (isActive) {
          setIsLoadingClubs(false)
        }
      }
    }

    void loadProjectData()

    return () => {
      isActive = false
    }
  }, [selectedProjectId])

  useEffect(() => {
    let isActive = true

    async function loadClubMembers() {
      if (!selectedClubId) {
        setClubMembers([])
        return
      }

      setIsLoadingMembers(true)

      try {
        const payload = await fetchClubMembers(selectedClubId)

        if (!isActive) {
          return
        }

        setClubMembers(payload.clubMembers)
      } catch {
        if (isActive) {
          setClubMembers([])
        }
      } finally {
        if (isActive) {
          setIsLoadingMembers(false)
        }
      }
    }

    void loadClubMembers()

    return () => {
      isActive = false
    }
  }, [selectedClubId])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )
  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) ?? null,
    [clubs, selectedClubId],
  )

  const currentProjectMember = useMemo(
    () => projectMembers.find((member) => member.membershipNumber === user?.membershipNumber) ?? null,
    [projectMembers, user?.membershipNumber],
  )

  const canManageSelectedProject = Boolean(
    user?.membershipNumber && selectedProject && (selectedProject.owner === user.membershipNumber || currentProjectMember?.role === 'manager'),
  )

  const selectedClubMemberRecord = useMemo(
    () => clubMembers.find((member) => member.membershipNumber === user?.membershipNumber) ?? null,
    [clubMembers, user?.membershipNumber],
  )

  const pendingMembers = useMemo(
    () => clubMembers.filter((member) => member.status === 'pending'),
    [clubMembers],
  )

  const handleCreateClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!user?.membershipNumber || !selectedProjectId) {
      setCreateError('اختر مشروعاً أولاً.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const visibility = String(formData.get('visibility') ?? 'public').trim()
    const joinPolicy = String(formData.get('joinPolicy') ?? 'auto_approve').trim()

    if (!name) {
      setCreateError('يرجى إدخال اسم النادي.')
      return
    }

    const normalizedVisibility = visibility === 'private' || visibility === 'draft' ? visibility : 'public'
    const normalizedJoinPolicy =
      joinPolicy === 'request_to_join' || joinPolicy === 'invite_only' ? joinPolicy : 'auto_approve'

    setIsCreatingClub(true)

    try {
      const payload = await createClub(
        {
          projectId: selectedProjectId,
          name,
          description: description || undefined,
          visibility: normalizedVisibility,
          joinPolicy: normalizedJoinPolicy,
        },
        user.membershipNumber,
      )

      setClubs((previous) => [payload.club, ...previous])
      setSelectedClubId(payload.club.id)
      form.reset()
    } catch (requestError) {
      if (requestError instanceof Error) {
        setCreateError(requestError.message)
      } else {
        setCreateError('تعذر إنشاء النادي.')
      }
    } finally {
      setIsCreatingClub(false)
    }
  }

  const refreshMembers = async (clubId: string) => {
    const payload = await fetchClubMembers(clubId)
    setClubMembers(payload.clubMembers)
  }

  const handleJoinOrRequest = async (club: VmsClub) => {
    setActionError(null)

    if (!user?.membershipNumber) {
      setActionError('يجب تسجيل الدخول أولاً.')
      return
    }

    try {
      await createClubMember(
        {
          clubId: club.id,
          membershipNumber: user.membershipNumber,
        },
        user.membershipNumber,
      )

      if (club.id === selectedClubId) {
        await refreshMembers(club.id)
      }
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر تنفيذ العملية.')
      }
    }
  }

  const handleLeaveClub = async (clubId: string) => {
    setActionError(null)

    if (!user?.membershipNumber) {
      setActionError('يجب تسجيل الدخول أولاً.')
      return
    }

    try {
      await deleteClubMember(clubId, user.membershipNumber, user.membershipNumber)

      if (clubId === selectedClubId) {
        await refreshMembers(clubId)
      }
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر مغادرة النادي.')
      }
    }
  }

  const handleModerateMembership = async (membershipNumber: string, status: 'active' | 'rejected') => {
    setActionError(null)

    if (!user?.membershipNumber || !selectedClubId) {
      setActionError('لم يتم تحديد نادي.')
      return
    }

    try {
      await updateClubMember(selectedClubId, membershipNumber, { status }, user.membershipNumber)
      await refreshMembers(selectedClubId)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر تحديث الطلب.')
      }
    }
  }

  const handleDeleteClub = async (clubId: string) => {
    setActionError(null)

    if (!user?.membershipNumber) {
      setActionError('يجب تسجيل الدخول أولاً.')
      return
    }

    try {
      await deleteClub(clubId, user.membershipNumber)
      setClubs((previous) => previous.filter((club) => club.id !== clubId))
      setSelectedClubId((current) => (current === clubId ? '' : current))
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر حذف النادي.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">الأندية</h2>
            <p className="mt-1 text-sm text-slate-500">
              إدارة أندية المشاريع، طلبات الانضمام، وتتبّع أعضاء كل نادي.
            </p>
          </div>

          <label className="flex w-full max-w-sm flex-col gap-1.5 text-sm text-slate-600">
            المشروع
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
            >
              {!selectedProjectId ? <option value="">اختر مشروعاً</option> : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoadingProjects ? (
          <p className="mt-4 text-sm text-slate-500">جار تحميل المشاريع...</p>
        ) : null}

        {!isLoadingProjects && selectedProject ? (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            المشروع المحدد: <span className="font-semibold text-slate-800">{selectedProject.name}</span>
          </p>
        ) : null}

        {canManageSelectedProject ? (
          <form onSubmit={handleCreateClub} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-slate-600">
              اسم النادي
              <input
                name="name"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                placeholder="مثال: نادي تطوير الويب"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-slate-600">
              الوصف
              <input
                name="description"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
                placeholder="اختياري"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-slate-600">
              الظهور
              <select
                name="visibility"
                defaultValue="public"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              >
                <option value="public">عام</option>
                <option value="private">خاص</option>
                <option value="draft">مسودة</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm text-slate-600">
              آلية الانضمام
              <select
                name="joinPolicy"
                defaultValue="auto_approve"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20"
              >
                <option value="auto_approve">دخول مباشر</option>
                <option value="request_to_join">طلب انضمام</option>
                <option value="invite_only">بدعوة فقط</option>
              </select>
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isCreatingClub || !selectedProjectId}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {isCreatingClub ? 'جار الإنشاء...' : 'إنشاء نادي'}
              </button>
              {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            يمكن لمالك المشروع أو المديرين فقط إنشاء الأندية.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-semibold text-slate-900">قائمة الأندية</h3>
            {!isLoadingClubs ? <span className="text-xs text-slate-500">{clubs.length} نادي</span> : null}
          </div>

          {isLoadingClubs ? <p className="mt-4 text-sm text-slate-500">جار تحميل الأندية...</p> : null}

          {!isLoadingClubs && clubs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
              لا توجد أندية في هذا المشروع بعد.
            </p>
          ) : null}

          {!isLoadingClubs && clubs.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {clubs.map((club) => {
                const isSelected = club.id === selectedClubId
                const isCurrentMember = selectedClubId === club.id && selectedClubMemberRecord?.status === 'active'
                const isPending = selectedClubId === club.id && selectedClubMemberRecord?.status === 'pending'

                return (
                  <li key={club.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedClubId(club.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-right transition ${
                        isSelected
                          ? 'border-cyan-300 bg-cyan-50/70'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{club.name}</h4>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {VISIBILITY_LABEL[club.visibility] ?? club.visibility}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {JOIN_POLICY_LABEL[club.joinPolicy] ?? club.joinPolicy}
                      </p>

                      {club.description ? (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">{club.description}</p>
                      ) : null}

                      {isSelected ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {!isCurrentMember && !isPending ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleJoinOrRequest(club)
                              }}
                              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 hover:bg-cyan-100"
                            >
                              {club.joinPolicy === 'request_to_join' ? 'طلب الانضمام' : 'انضم الآن'}
                            </button>
                          ) : null}

                          {isCurrentMember ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleLeaveClub(club.id)
                              }}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              مغادرة النادي
                            </button>
                          ) : null}

                          {isPending ? (
                            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              طلبك قيد المراجعة
                            </span>
                          ) : null}

                          {canManageSelectedProject ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleDeleteClub(club.id)
                              }}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              حذف النادي
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </article>

        <article className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-semibold text-slate-900">أعضاء النادي</h3>
            <p className="mt-1 text-xs text-slate-500">
              {selectedClub ? `النادي المحدد: ${selectedClub.name}` : 'اختر نادياً لعرض الأعضاء.'}
            </p>
          </div>

          {isLoadingMembers ? <p className="mt-4 text-sm text-slate-500">جار تحميل الأعضاء...</p> : null}

          {!isLoadingMembers && selectedClub && clubMembers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">لا يوجد أعضاء في هذا النادي بعد.</p>
          ) : null}

          {!isLoadingMembers && clubMembers.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {clubMembers.map((member) => (
                <li key={`${member.clubId}-${member.membershipNumber}`} className="rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.displayName}</p>
                      <p className="text-xs text-slate-500">{member.membershipNumber}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {MEMBER_STATUS_LABEL[member.status] ?? member.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {canManageSelectedProject && pendingMembers.length > 0 ? (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900">طلبات الانضمام</h4>
              <ul className="mt-3 space-y-2">
                {pendingMembers.map((member) => (
                  <li key={`pending-${member.clubId}-${member.membershipNumber}`} className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{member.displayName}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleModerateMembership(member.membershipNumber, 'active')}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          قبول
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleModerateMembership(member.membershipNumber, 'rejected')}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {actionError ? <p className="mt-4 text-sm text-red-600">{actionError}</p> : null}
        </article>
      </section>
    </div>
  )
}