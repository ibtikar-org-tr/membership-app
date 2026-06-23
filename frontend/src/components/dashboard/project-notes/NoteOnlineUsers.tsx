import type { NoteCollaborator } from '../../../hooks/useProjectNoteCollaboration'
import { colorForMembershipNumber } from '../../../utils/collaborator-color'

export interface ResolvedOnlineUser {
  membershipNumber: string
  displayName: string
  color: string
}

export function resolveOnlineNoteUsers(
  collaborators: NoteCollaborator[],
  displayNameByMembershipNumber: Map<string, string>,
) {
  const seen = new Set<string>()
  const users: ResolvedOnlineUser[] = []

  for (const collaborator of collaborators) {
    if (seen.has(collaborator.membershipNumber)) {
      continue
    }

    seen.add(collaborator.membershipNumber)
    users.push({
      membershipNumber: collaborator.membershipNumber,
      displayName:
        displayNameByMembershipNumber.get(collaborator.membershipNumber)?.trim() ||
        collaborator.displayName ||
        collaborator.membershipNumber,
      color: colorForMembershipNumber(collaborator.membershipNumber),
    })
  }

  return users
}

interface NoteOnlineUsersProps {
  users: ResolvedOnlineUser[]
  className?: string
}

export function NoteOnlineUsers({ users, className = 'mt-2' }: NoteOnlineUsersProps) {
  if (users.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-slate-500">متصل الآن</span>
      {users.map((user) => (
        <span
          key={user.membershipNumber}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700"
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: user.color }} aria-hidden />
          {user.displayName}
        </span>
      ))}
    </div>
  )
}
