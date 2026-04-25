import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Globe, MapPin, Users } from 'lucide-react'
import {
  createClubMember,
  fetchClubById,
  fetchClubMembers,
} from '../../api/vms'
import type { VmsClub, VmsClubMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { UnallowedAccessPage } from './UnallowedAccessPage'

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

export function DashboardClubPage() {
  const { clubID } = useParams()
  const user = useMemo(() => getStoredUser(), [])

  const [club, setClub] = useState<VmsClub | null>(null)
  const [clubMembers, setClubMembers] = useState<VmsClubMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!clubID) {
      return
    }

    const currentClubId = clubID
    const controller = new AbortController()

    async function loadClub() {
      try {
        const clubPayload = await fetchClubById(currentClubId)

        if (controller.signal.aborted) {
          return
        }

        if (clubPayload.club.visibility !== 'public') {
          setNotFound(true)
          return
        }

        setClub(clubPayload.club)

        const clubMembersPayload = await fetchClubMembers(clubPayload.club.id)

        if (controller.signal.aborted) {
          return
        }

        setClubMembers(clubMembersPayload.clubMembers)
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

    void loadClub()

    return () => {
      controller.abort()
    }
  }, [clubID, user?.membershipNumber])

  const currentMembership = useMemo(
    () => clubMembers.find((member) => member.membershipNumber === user?.membershipNumber) ?? null,
    [clubMembers, user?.membershipNumber],
  )

  const handleJoinClub = async () => {
    setActionError(null)

    if (!club || !user?.membershipNumber) {
      return
    }

    if (currentMembership) {
      setActionError('أنت مسجل بالفعل في هذا النادي.')
      return
    }

    setIsJoining(true)

    try {
      await createClubMember(
        {
          clubId: club.id,
          membershipNumber: user.membershipNumber,
        },
        user.membershipNumber,
      )

      const payload = await fetchClubMembers(club.id)
      setClubMembers(payload.clubMembers)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر الانضمام إلى النادي.')
      }
    } finally {
      setIsJoining(false)
    }
  }

  if (!clubID || notFound) {
    return <UnallowedAccessPage />
  }

  if (isLoading || !club) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل النادي...</p>
      </section>
    )
  }

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5">
        {club.imageUrl ? (
          <div className="relative h-44 sm:h-52 md:h-60">
            <img src={club.imageUrl} alt={club.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
          </div>
        ) : (
          <div className="relative flex h-36 items-center justify-center bg-linear-to-br from-slate-100 via-slate-50 to-cyan-50/40 sm:h-44">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <Users className="h-10 w-10 text-slate-400" strokeWidth={1.25} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6 md:p-8">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {VISIBILITY_LABEL[club.visibility] ?? club.visibility}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {JOIN_POLICY_LABEL[club.joinPolicy] ?? club.joinPolicy}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {clubMembers.length} عضو
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700/90">صفحة النادي</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{club.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {club.description ?? 'لا يوجد وصف لهذا النادي.'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch sm:gap-2 lg:flex-row">
            <Link
              to={`/dashboard/projects/${club.projectId}/clubs`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              أندية المشروع
              <CalendarDays className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {club.address === 'online' || club.country || club.region || club.city || club.address ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">تفاصيل الموقع</h2>
          </div>
          {club.address === 'online' ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">نادي أون لاين</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {club.country ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">الدولة</span>
                  <p className="mt-1 font-semibold text-slate-900">{club.country}</p>
                </div>
              ) : null}
              {club.region ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">المنطقة</span>
                  <p className="mt-1 font-semibold text-slate-900">{club.region}</p>
                </div>
              ) : null}
              {club.city ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">المدينة</span>
                  <p className="mt-1 font-semibold text-slate-900">{club.city}</p>
                </div>
              ) : null}
              {club.address ? (
                <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
                  <span className="text-slate-500">العنوان التفصيلي</span>
                  <p className="mt-1 font-semibold text-slate-900">{club.address}</p>
                </div>
              ) : null}
            </div>
          )}
        </article>
      ) : null}

      {club.telegramGroupId ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="h-5 w-5 text-cyan-600" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">مجموعة التلغرام</h2>
          </div>
          <p className="mt-4 text-sm text-slate-600">{club.telegramGroupId}</p>
        </article>
      ) : null}

      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Users className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
          <h2 className="text-base font-semibold text-slate-900">العضوية</h2>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {currentMembership ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {MEMBER_STATUS_LABEL[currentMembership.status] ?? currentMembership.status}
            </span>
          ) : club.joinPolicy === 'invite_only' ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              الانضمام بدعوة فقط
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void handleJoinClub()}
              disabled={isJoining}
              className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isJoining ? 'جار الإرسال...' : club.joinPolicy === 'request_to_join' ? 'طلب الانضمام' : 'الانضمام للنادي'}
            </button>
          )}
        </div>

        {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
      </article>

      {club.skills && Object.keys(club.skills).length > 0 ? (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-900">المهارات</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(club.skills).map(([skillName, skillType]) => (
              <span
                key={skillName}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-linear-to-br from-white to-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm"
              >
                {skillName}
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                  {skillType}
                </span>
              </span>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}