import { Crown, Medal, Trophy } from 'lucide-react'
import type { VmsLeaderboardEntry } from '../../types/vms'

interface CommunityLeaderboardProps {
  entries: VmsLeaderboardEntry[]
  currentUser: VmsLeaderboardEntry | null
  currentMembershipNumber?: string
}

const PODIUM_STYLES = [
  {
    rank: 1,
    container: 'order-2 sm:order-2',
    card: 'border-amber-200 bg-linear-to-b from-amber-50 to-white shadow-md shadow-amber-100/80',
    badge: 'bg-amber-500 text-white',
    icon: Crown,
    iconClass: 'text-amber-500',
    height: 'sm:mt-0',
  },
  {
    rank: 2,
    container: 'order-1 sm:order-1',
    card: 'border-slate-200 bg-linear-to-b from-slate-50 to-white',
    badge: 'bg-slate-500 text-white',
    icon: Medal,
    iconClass: 'text-slate-500',
    height: 'sm:mt-6',
  },
  {
    rank: 3,
    container: 'order-3 sm:order-3',
    card: 'border-orange-200 bg-linear-to-b from-orange-50 to-white',
    badge: 'bg-orange-500 text-white',
    icon: Medal,
    iconClass: 'text-orange-500',
    height: 'sm:mt-10',
  },
] as const

function getInitials(displayName: string) {
  const trimmed = displayName.trim()
  if (!trimmed) {
    return '?'
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }

  return trimmed.slice(0, 2).toUpperCase()
}

function formatPoints(points: number) {
  return points.toLocaleString('en-US')
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: VmsLeaderboardEntry
  isCurrentUser: boolean
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl border px-3 py-3 transition',
        isCurrentUser ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          isCurrentUser ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700',
        ].join(' ')}
      >
        {entry.rank}
      </span>

      <span
        className={[
          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          isCurrentUser ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
        ].join(' ')}
      >
        {getInitials(entry.displayName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{entry.displayName}</p>
        <p className="truncate text-xs text-slate-500">{entry.membershipNumber}</p>
      </div>

      <div className="text-left">
        <p className="text-sm font-bold text-slate-900">{formatPoints(entry.points)}</p>
        <p className="text-[11px] text-slate-500">نقطة</p>
      </div>
    </div>
  )
}

function PodiumCard({
  entry,
  style,
  isCurrentUser,
}: {
  entry: VmsLeaderboardEntry
  style: (typeof PODIUM_STYLES)[number]
  isCurrentUser: boolean
}) {
  const Icon = style.icon

  return (
    <div className={`flex flex-col items-center ${style.container} ${style.height}`}>
      <div
        className={[
          'relative flex w-full max-w-44 flex-col items-center rounded-2xl border px-4 pb-4 pt-5 text-center',
          style.card,
          isCurrentUser ? 'ring-2 ring-emerald-300 ring-offset-2' : '',
        ].join(' ')}
      >
        <span className={`absolute -top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}>
          {entry.rank}
        </span>

        <Icon className={`h-5 w-5 ${style.iconClass}`} aria-hidden />

        <span className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">
          {getInitials(entry.displayName)}
        </span>

        <p className="mt-3 w-full truncate text-sm font-semibold text-slate-900">{entry.displayName}</p>
        <p className="mt-0.5 w-full truncate text-[11px] text-slate-500">{entry.membershipNumber}</p>
        <p className="mt-3 text-lg font-bold text-slate-900">{formatPoints(entry.points)}</p>
        <p className="text-[11px] text-slate-500">نقطة</p>
      </div>
    </div>
  )
}

export function CommunityLeaderboard({ entries, currentUser, currentMembershipNumber }: CommunityLeaderboardProps) {
  const topThree = entries.filter((entry) => entry.rank <= 3)
  const rest = entries.filter((entry) => entry.rank > 3)
  const currentUserInList = entries.some((entry) => entry.membershipNumber === currentMembershipNumber)
  const showCurrentUserCard = currentUser && !currentUserInList

  if (entries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
        <Trophy className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
        <p className="mt-4 text-sm font-medium text-slate-800">لا يوجد متصدرون بعد</p>
        <p className="mt-1 text-xs text-slate-500">أكمل المهام واجمع النقاط لتظهر في لوحة المتصدرين.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      {topThree.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          {PODIUM_STYLES.map((style) => {
            const entry = topThree.find((item) => item.rank === style.rank)
            if (!entry) {
              return <div key={`podium-empty-${style.rank}`} className="hidden sm:block" />
            }

            return (
              <PodiumCard
                key={entry.membershipNumber}
                entry={entry}
                style={style}
                isCurrentUser={entry.membershipNumber === currentMembershipNumber}
              />
            )
          })}
        </div>
      ) : null}

      {showCurrentUserCard ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs font-semibold text-emerald-800">ترتيبك</p>
          <div className="mt-3">
            <LeaderboardRow entry={currentUser} isCurrentUser />
          </div>
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">بقية المتصدرين</h3>
          <div className="space-y-2">
            {rest.map((entry) => (
              <LeaderboardRow
                key={entry.membershipNumber}
                entry={entry}
                isCurrentUser={entry.membershipNumber === currentMembershipNumber}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        {[0, 1, 2].map((key) => (
          <div key={`leaderboard-podium-skeleton-${key}`} className="flex justify-center">
            <div className="h-52 w-full max-w-44 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((key) => (
          <div key={`leaderboard-row-skeleton-${key}`} className="h-16 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

CommunityLeaderboard.Skeleton = LeaderboardSkeleton
