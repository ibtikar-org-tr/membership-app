import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { MentionableMember } from './mentionable-members'

export interface MemberMentionListProps {
  items: MentionableMember[]
  command: (item: MentionableMember) => void
}

export interface MemberMentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

function memberRoleLabel(role?: string) {
  if (role === 'owner') {
    return 'مالك المشروع'
  }

  if (role === 'manager') {
    return 'مدير'
  }

  if (role === 'observer') {
    return 'مراقب'
  }

  if (role === 'member') {
    return 'عضو'
  }

  return null
}

export const MemberMentionList = forwardRef<MemberMentionListHandle, MemberMentionListProps>(
  function MemberMentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSelectedIndex((current) => (current + items.length - 1) % Math.max(items.length, 1))
          return true
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSelectedIndex((current) => (current + 1) % Math.max(items.length, 1))
          return true
        }

        if (event.key === 'Enter') {
          event.preventDefault()
          selectItem(selectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="w-56 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-lg">
          لا يوجد أعضاء مطابقون
        </div>
      )
    }

    return (
      <div className="max-h-60 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
        {items.map((item, index) => {
          const roleLabel = memberRoleLabel(item.role)
          const isSelected = index === selectedIndex

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(index)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start transition ${
                isSelected ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.label}</span>
                {roleLabel ? (
                  <span className="block truncate text-[11px] text-slate-500">{roleLabel}</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    )
  },
)
