import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchClubMembers, fetchClubs, fetchProjects } from '../../api/vms'
import type { VmsClub } from '../../types/vms'
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

export function DashboardClubsPage() {
  const user = useMemo(() => getStoredUser(), [])
  const [clubs, setClubs] = useState<VmsClub[]>([])
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
  const [clubMemberCounts, setClubMemberCounts] = useState<Record<string, number>>({})
  const [joinedClubIds, setJoinedClubIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const publicClubs = useMemo(
    () => clubs.filter((club) => club.visibility === 'public'),
    [clubs],
  )

  const joinedPublicClubs = useMemo(
    () => publicClubs.filter((club) => joinedClubIds.has(club.id)),
    [publicClubs, joinedClubIds],
  )

  const otherPublicClubs = useMemo(
    () => publicClubs.filter((club) => !joinedClubIds.has(club.id)),
    [publicClubs, joinedClubIds],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadClubs() {
      try {
        const [clubsPayload, projectsPayload] = await Promise.all([
          fetchClubs(),
          fetchProjects(user?.membershipNumber),
        ])

        const publicOnly = clubsPayload.clubs.filter((club) => club.visibility === 'public')
        const clubMembersPayload = await Promise.all(
          publicOnly.map(async (club) => {
            const payload = await fetchClubMembers(club.id, 'active')
            return { clubId: club.id, members: payload.clubMembers }
          }),
        )

        const nextProjectNames: Record<string, string> = {}
        for (const project of projectsPayload.projects) {
          nextProjectNames[project.id] = project.name
        }

        const nextMemberCounts: Record<string, number> = {}
        const nextJoinedClubIds = new Set<string>()

        for (const entry of clubMembersPayload) {
          nextMemberCounts[entry.clubId] = entry.members.length

          if (
            user?.membershipNumber &&
            entry.members.some((member) => member.membershipNumber === user.membershipNumber)
          ) {
            nextJoinedClubIds.add(entry.clubId)
          }
        }

        if (!controller.signal.aborted) {
          setClubs(clubsPayload.clubs)
          setProjectNames(nextProjectNames)
          setClubMemberCounts(nextMemberCounts)
          setJoinedClubIds(nextJoinedClubIds)
          setHasError(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadClubs()

    return () => {
      controller.abort()
    }
  }, [user?.membershipNumber])

  const renderClubCard = (club: VmsClub) => {
    const description = club.description?.trim()

    return (
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

          {description ? <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{description}</p> : null}

          <div className="mt-3 flex flex-col gap-1 text-[11px] text-slate-500">
            <span>المشروع: {projectNames[club.projectId] ?? club.projectId}</span>
            <span>عدد الأعضاء: {clubMemberCounts[club.id] ?? 0}</span>
          </div>

          <div className="mt-3 text-left">
            <Link
              to={`/dashboard/clubs/${club.id}`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
            >
              التفاصيل
            </Link>
          </div>
        </article>
      </li>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الأندية</h2>
          <p className="mt-1 text-sm text-slate-500">الأندية العامة المنشورة ضمن المشاريع.</p>
          <p className="mt-1 text-xs text-slate-500">إضافة الأندية وإدارتها تتم من صفحة المشروع بواسطة مالك المشروع أو مديريه.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {publicClubs.length} نادي عام
        </span>
      </div>

      {isLoading ? <p className="mt-6 text-center text-sm text-slate-500">جار تحميل الأندية...</p> : null}
      {hasError ? <p className="mt-6 text-center text-sm text-red-600">تعذر تحميل الأندية.</p> : null}

      {!isLoading && !hasError ? (
        publicClubs.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-500">لا توجد أندية عامة حالياً.</p>
        ) : (
          <div className="mt-6 space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">الأندية التي انضممت إليها</h3>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  {joinedPublicClubs.length} نادي
                </span>
              </div>

              {joinedPublicClubs.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  لم تنضم إلى أي نادٍ عام بعد.
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{joinedPublicClubs.map(renderClubCard)}</ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">باقي الأندية العامة</h3>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  {otherPublicClubs.length} نادي
                </span>
              </div>

              {otherPublicClubs.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  لا توجد أندية عامة إضافية.
                </p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{otherPublicClubs.map(renderClubCard)}</ul>
              )}
            </section>
          </div>
        )
      ) : null}
    </section>
  )
}
