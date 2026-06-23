import { useEffect, useRef } from 'react'
import type * as Y from 'yjs'
import type { NoteCollaborator } from '../../../hooks/useProjectNoteCollaboration'

interface CollaborativeNoteEditorProps {
  yText: Y.Text | null
  initialContent?: string
  readOnly?: boolean
  connectionState: 'idle' | 'connecting' | 'connected' | 'error'
  collaborators: NoteCollaborator[]
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

export function CollaborativeNoteEditor({
  yText,
  initialContent = '',
  readOnly = false,
  connectionState,
  collaborators,
}: CollaborativeNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const isApplyingRemoteRef = useRef(false)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    if (!yText) {
      textarea.value = initialContent
      return
    }

    isApplyingRemoteRef.current = true
    textarea.value = yText.toString()
    isApplyingRemoteRef.current = false

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
    }

    yText.observe(handleRemoteUpdate)

    const handleInput = () => {
      if (readOnly || isApplyingRemoteRef.current) {
        return
      }

      applyTextareaValueToYText(textarea, yText)
    }

    textarea.addEventListener('input', handleInput)

    return () => {
      yText.unobserve(handleRemoteUpdate)
      textarea.removeEventListener('input', handleInput)
    }
  }, [initialContent, readOnly, yText])

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
                key={`${collaborator.membershipNumber}-${collaborator.clientId}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: collaborator.color }} />
                {collaborator.displayName}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <textarea
        ref={textareaRef}
        readOnly={!canEdit}
        placeholder={readOnly ? 'يمكنك مشاهدة هذه الملاحظة فقط.' : 'ابدأ الكتابة... سيتم مزامنة التغييرات مع فريق المشروع مباشرة.'}
        className="min-h-88 flex-1 resize-none rounded-b-2xl bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  )
}
