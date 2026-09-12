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
        <div className="w-56 rounded-xl border border-[#e6e6e6] bg-white p-3 text-[12px] text-[#a39e98] shadow-[rgba(0,0,0,0.04)_0_4px_18px]">
          لا يوجد أعضاء مطابقون
        </div>
      )
    }

    return (
      <div className="max-h-60 w-64 overflow-auto rounded-xl border border-[#e6e6e6] bg-white p-1 shadow-[rgba(0,0,0,0.04)_0_4px_18px]">
        {items.map((item, index) => {
          const roleLabel = memberRoleLabel(item.role)
          const isSelected = index === selectedIndex

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(index)}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-[5px] px-2.5 py-2 text-start transition ${
                isSelected ? 'bg-[#f6f5f4] text-black' : 'text-[#31302e] hover:bg-[#f6f5f4]'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{item.label}</span>
                {roleLabel ? (
                  <span className="block truncate text-[11px] text-[#a39e98]">{roleLabel}</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    )
  },
)
