import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import type { NoteCollaborator, NoteRemoteCursor } from '../../../hooks/useProjectNoteCollaboration'
import { RemoteCollaboratorCursors } from './RemoteCollaboratorCursors'

interface CollaborativeNoteEditorProps {
  yText: Y.Text | null
  initialContent?: string
  readOnly?: boolean
  connectionState: 'idle' | 'connecting' | 'connected' | 'error'
  collaborators: NoteCollaborator[]
  remoteCursors: NoteRemoteCursor[]
  onLocalCursorChange?: (anchor: number, head: number) => void
}

function applyTextareaValueToYText(textarea: HTMLTextAreaElement, yText: Y.Text) {
  const nextValue = textarea.value
  const currentValue = yText.toString()

  if (nextValue === currentValue) {
    return
  }

  let start = 0
  while (
    start < currentValue.length &&
    start < nextValue.length &&
    currentValue.charCodeAt(start) === nextValue.charCodeAt(start)
  ) {
    start += 1
  }

  let endCurrent = currentValue.length
  let endNext = nextValue.length
  while (
    endCurrent > start &&
    endNext > start &&
    currentValue.charCodeAt(endCurrent - 1) === nextValue.charCodeAt(endNext - 1)
  ) {
    endCurrent -= 1
    endNext -= 1
  }

  const deleteLength = endCurrent - start
  const insertText = nextValue.slice(start, endNext)

  yText.doc?.transact(() => {
    if (deleteLength > 0) {
      yText.delete(start, deleteLength)
    }

    if (insertText.length > 0) {
      yText.insert(start, insertText)
    }
  })
}

function publishCursor(
  textarea: HTMLTextAreaElement,
  onLocalCursorChange: ((anchor: number, head: number) => void) | undefined,
) {
  onLocalCursorChange?.(textarea.selectionStart, textarea.selectionEnd)
}

export function CollaborativeNoteEditor({
  yText,
  initialContent = '',
  readOnly = false,
  connectionState,
  collaborators,
  remoteCursors,
  onLocalCursorChange,
}: CollaborativeNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const isApplyingRemoteRef = useRef(false)
  const [contentVersion, setContentVersion] = useState(0)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    if (!yText) {
      textarea.value = initialContent
      setContentVersion((value) => value + 1)
      return
    }

    isApplyingRemoteRef.current = true
    textarea.value = yText.toString()
    isApplyingRemoteRef.current = false
    setContentVersion((value) => value + 1)
    publishCursor(textarea, onLocalCursorChange)

    const handleRemoteUpdate = (event: Y.YTextEvent) => {
      if (event.transaction.local) {
        return
      }

      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      const nextValue = yText.toString()

      if (textarea.value === nextValue) {
        return
      }

      isApplyingRemoteRef.current = true
      textarea.value = nextValue

      if (document.activeElement === textarea) {
        const nextStart = Math.min(selectionStart, nextValue.length)
        const nextEnd = Math.min(selectionEnd, nextValue.length)
        textarea.setSelectionRange(nextStart, nextEnd)
      }

      isApplyingRemoteRef.current = false
      setContentVersion((value) => value + 1)
      publishCursor(textarea, onLocalCursorChange)
    }

    yText.observe(handleRemoteUpdate)

    const handleInput = () => {
      if (readOnly || isApplyingRemoteRef.current) {
        return
      }

      applyTextareaValueToYText(textarea, yText)
      setContentVersion((value) => value + 1)
      publishCursor(textarea, onLocalCursorChange)
    }

    const handleSelectionChange = () => {
      if (document.activeElement !== textarea || isApplyingRemoteRef.current) {
        return
      }

      publishCursor(textarea, onLocalCursorChange)
    }

    textarea.addEventListener('input', handleInput)
    textarea.addEventListener('keyup', handleSelectionChange)
    textarea.addEventListener('click', handleSelectionChange)
    textarea.addEventListener('select', handleSelectionChange)
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      yText.unobserve(handleRemoteUpdate)
      textarea.removeEventListener('input', handleInput)
      textarea.removeEventListener('keyup', handleSelectionChange)
      textarea.removeEventListener('click', handleSelectionChange)
      textarea.removeEventListener('select', handleSelectionChange)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [initialContent, onLocalCursorChange, readOnly, yText])

  const uniqueCollaborators = collaborators.reduce<NoteCollaborator[]>((accumulator, collaborator) => {
    if (accumulator.some((item) => item.membershipNumber === collaborator.membershipNumber)) {
      return accumulator
    }

    accumulator.push(collaborator)
    return accumulator
  }, [])

  const canEdit = Boolean(yText) && !readOnly

  return (
    <div className="flex h-full min-h-96 flex-col rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-500'
                : connectionState === 'connecting'
                  ? 'bg-amber-400'
                  : connectionState === 'error'
                    ? 'bg-red-500'
                    : 'bg-slate-300'
            }`}
          />
          {connectionState === 'connected'
            ? 'متصل — التحرير المشترك مفعّل'
            : connectionState === 'connecting'
              ? 'جار الاتصال بالمحرر المشترك...'
              : connectionState === 'error'
                ? 'تعذر الاتصال بالمحرر المشترك'
                : 'في انتظار الاتصال'}
        </div>
        {uniqueCollaborators.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {uniqueCollaborators.map((collaborator) => (
              <span
                key={collaborator.membershipNumber}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: collaborator.color }} />
                {collaborator.displayName}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative min-h-88 flex-1">
        <textarea
          ref={textareaRef}
          readOnly={!canEdit}
          placeholder={
            readOnly
              ? 'يمكنك مشاهدة هذه الملاحظة فقط.'
              : 'ابدأ الكتابة... سيتم مزامنة التغييرات مع فريق المشروع مباشرة.'
          }
          className="min-h-88 h-full w-full resize-none rounded-b-2xl bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <RemoteCollaboratorCursors
          textareaRef={textareaRef}
          cursors={remoteCursors}
          contentVersion={contentVersion}
        />
      </div>
    </div>
  )
}
