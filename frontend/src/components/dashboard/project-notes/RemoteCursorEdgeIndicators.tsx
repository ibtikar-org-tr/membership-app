import { useEffect, useState, type RefObject } from 'react'
import type { Editor } from '@tiptap/react'

type CursorEdge = 'above' | 'below'

interface OffscreenCursor {
  key: string
  name: string
  color: string
  edge: CursorEdge
}

interface RemoteCursorEdgeIndicatorsProps {
  editor: Editor | null
  scrollContainerRef: RefObject<HTMLElement | null>
  enabled?: boolean
}

function readCaretColor(caret: HTMLElement) {
  return caret.style.borderColor || caret.style.borderInlineStartColor || '#615d59'
}

function collectOffscreenCursors(container: HTMLElement): OffscreenCursor[] {
  const containerRect = container.getBoundingClientRect()
  const carets = container.querySelectorAll<HTMLElement>('.collaboration-cursor__caret')
  const results: OffscreenCursor[] = []
  const seen = new Set<string>()

  carets.forEach((caret, index) => {
    const rect = caret.getBoundingClientRect()
    const label = caret.querySelector('.collaboration-cursor__label')
    const name = label?.textContent?.trim() || `مستخدم ${index + 1}`
    const color = readCaretColor(caret)
    const identity = `${name}:${color}`

    let edge: CursorEdge | null = null
    if (rect.bottom < containerRect.top + 2) {
      edge = 'above'
    } else if (rect.top > containerRect.bottom - 2) {
      edge = 'below'
    }

    if (!edge) {
      return
    }

    const key = `${identity}:${edge}`
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    results.push({ key, name, color, edge })
  })

  return results
}

function EdgeArrow({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className="h-2.5 w-2.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'up' ? (
        <path d="M2 8 L6 4 L10 8" />
      ) : (
        <path d="M2 4 L6 8 L10 4" />
      )}
    </svg>
  )
}

function EdgePill({ name, color, direction }: { name: string; color: string; direction: 'up' | 'down' }) {
  return (
    <span
      className="pointer-events-none inline-flex max-w-40 items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-50 shadow-sm"
      style={{ backgroundColor: color }}
      title={name}
    >
      <EdgeArrow direction={direction} />
      <span className="truncate">{name}</span>
    </span>
  )
}

export function RemoteCursorEdgeIndicators({
  editor,
  scrollContainerRef,
  enabled = true,
}: RemoteCursorEdgeIndicatorsProps) {
  const [cursors, setCursors] = useState<OffscreenCursor[]>([])

  useEffect(() => {
    if (!enabled || !editor) {
      setCursors([])
      return
    }

    const container = scrollContainerRef.current
    if (!container) {
      setCursors([])
      return
    }

    let frame = 0
    const scheduleUpdate = () => {
      if (frame) {
        return
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const next = collectOffscreenCursors(container)
        setCursors((prev) => {
          if (
            prev.length === next.length &&
            prev.every((item, index) => item.key === next[index]?.key)
          ) {
            return prev
          }
          return next
        })
      })
    }

    scheduleUpdate()
    container.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    editor.on('transaction', scheduleUpdate)
    editor.on('selectionUpdate', scheduleUpdate)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      container.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      editor.off('transaction', scheduleUpdate)
      editor.off('selectionUpdate', scheduleUpdate)
    }
  }, [editor, enabled, scrollContainerRef])

  if (!enabled || cursors.length === 0) {
    return null
  }

  const above = cursors.filter((cursor) => cursor.edge === 'above')
  const below = cursors.filter((cursor) => cursor.edge === 'below')

  return (
    <>
      {above.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex flex-wrap justify-center gap-1.5 px-3">
          {above.map((cursor) => (
            <EdgePill key={cursor.key} name={cursor.name} color={cursor.color} direction="up" />
          ))}
        </div>
      ) : null}
      {below.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex flex-wrap justify-center gap-1.5 px-3">
          {below.map((cursor) => (
            <EdgePill key={cursor.key} name={cursor.name} color={cursor.color} direction="down" />
          ))}
        </div>
      ) : null}
    </>
  )
}
