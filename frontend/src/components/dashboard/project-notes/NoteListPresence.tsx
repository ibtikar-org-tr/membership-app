import type { ProjectNotePresenceViewer } from '../../../hooks/useProjectNoteCollaboration'

interface NoteListPresenceProps {
  viewers: ProjectNotePresenceViewer[]
  maxDots?: number
}

export function NoteListPresence({ viewers, maxDots = 3 }: NoteListPresenceProps) {
  if (viewers.length === 0) {
    return null
  }

  const visible = viewers.slice(0, maxDots)
  const names = viewers.map((viewer) => viewer.displayName).join('، ')

  return (
    <div
      className="ms-auto inline-flex items-center gap-1.5"
      title={names}
      aria-label={`${viewers.length} متصل على هذه الملاحظة`}
    >
      <div className="flex items-center -space-x-1.5 space-x-reverse">
        {visible.map((viewer) => (
          <span
            key={viewer.membershipNumber}
            className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: viewer.color }}
            aria-hidden
          />
        ))}
      </div>
      <span className="min-w-[1.1rem] text-center text-[11px] font-semibold tabular-nums text-[#615d59]">
        {viewers.length}
      </span>
    </div>
  )
}
