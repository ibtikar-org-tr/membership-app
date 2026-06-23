import { useLayoutEffect, useMemo, useState } from 'react'
import type { NoteRemoteCursor } from '../../../hooks/useProjectNoteCollaboration'
import { getTextareaCaretCoordinates, getTextareaSelectionRect } from '../../../utils/textarea-caret'

interface PositionedCursor extends NoteRemoteCursor {
  caretTop: number
  caretLeft: number
  caretHeight: number
  selectionTop?: number
  selectionLeft?: number
  selectionWidth?: number
  selectionHeight?: number
}

interface RemoteCollaboratorCursorsProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  cursors: NoteRemoteCursor[]
  contentVersion: number
}

function computePositionedCursors(
  textarea: HTMLTextAreaElement,
  cursors: NoteRemoteCursor[],
): PositionedCursor[] {
  return cursors
    .map((cursor) => {
      const head = Math.max(0, Math.min(cursor.head, textarea.value.length))
      const anchor = Math.max(0, Math.min(cursor.anchor, textarea.value.length))
      const caret = getTextareaCaretCoordinates(textarea, head)
      const selection = getTextareaSelectionRect(textarea, anchor, head)

      return {
        ...cursor,
        caretTop: caret.top,
        caretLeft: caret.left,
        caretHeight: caret.height,
        selectionTop: selection?.top,
        selectionLeft: selection?.left,
        selectionWidth: selection?.width,
        selectionHeight: selection?.height,
      }
    })
    .filter((cursor) => Number.isFinite(cursor.caretTop) && Number.isFinite(cursor.caretLeft))
}

function cursorsSignature(cursors: NoteRemoteCursor[]) {
  return cursors
    .map((cursor) => `${cursor.clientId}:${cursor.anchor}:${cursor.head}`)
    .join('|')
}

export function RemoteCollaboratorCursors({ textareaRef, cursors, contentVersion }: RemoteCollaboratorCursorsProps) {
  const [layoutTick, setLayoutTick] = useState(0)
  const cursorSignature = cursorsSignature(cursors)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    const recalculate = () => {
      setLayoutTick((tick) => tick + 1)
    }

    textarea.addEventListener('scroll', recalculate)
    window.addEventListener('resize', recalculate)

    return () => {
      textarea.removeEventListener('scroll', recalculate)
      window.removeEventListener('resize', recalculate)
    }
  }, [textareaRef])

  const positionedCursors = useMemo(() => {
    void layoutTick

    const textarea = textareaRef.current
    if (!textarea || cursors.length === 0) {
      return []
    }

    return computePositionedCursors(textarea, cursors)
  }, [contentVersion, cursorSignature, cursors, layoutTick, textareaRef])

  if (positionedCursors.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-2xl px-4 py-4" aria-hidden>
      {positionedCursors.map((cursor) => (
        <div key={`remote-cursor-${cursor.clientId}`}>
          {cursor.selectionWidth && cursor.selectionWidth > 0 ? (
            <div
              className="absolute rounded-sm"
              style={{
                top: cursor.selectionTop,
                left: cursor.selectionLeft,
                width: cursor.selectionWidth,
                height: cursor.selectionHeight,
                backgroundColor: cursor.color,
                opacity: 0.22,
              }}
            />
          ) : null}
          <div
            className="absolute w-0.5 rounded-full"
            style={{
              top: cursor.caretTop,
              left: cursor.caretLeft,
              height: cursor.caretHeight,
              backgroundColor: cursor.color,
            }}
          />
          <div
            className="absolute max-w-[10rem] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
            style={{
              top: Math.max(cursor.caretTop - 18, 0),
              left: cursor.caretLeft,
              backgroundColor: cursor.color,
            }}
          >
            {cursor.displayName}
          </div>
        </div>
      ))}
    </div>
  )
}
