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

export function CollaborativeNoteEditor({
  yText,
  initialContent = '',
  readOnly = false,
  connectionState,
  collaborators,
}: CollaborativeNoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    if (!yText) {
      textarea.value = initialContent
      return
    }

    textarea.value = yText.toString()

    const handleRemoteUpdate = (event: Y.YTextEvent) => {
      if (event.transaction.local) {
        return
      }

      textarea.value = yText.toString()
    }

    yText.observe(handleRemoteUpdate)

    const handleInput = () => {
      if (readOnly) {
        return
      }

      const currentValue = yText.toString()
      const nextValue = textarea.value

      if (currentValue === nextValue) {
        return
      }

      yText.doc?.transact(() => {
        yText.delete(0, currentValue.length)
        if (nextValue.length > 0) {
          yText.insert(0, nextValue)
        }
      })
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

  return (
    <div className="flex h-full min-h-[24rem] flex-col rounded-2xl border border-slate-200 bg-white">
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
        readOnly={readOnly || !yText}
        placeholder={readOnly ? 'يمكنك مشاهدة هذه الملاحظة فقط.' : 'ابدأ الكتابة... سيتم مزامنة التغييرات مع فريق المشروع مباشرة.'}
        className="min-h-[22rem] flex-1 resize-none rounded-b-2xl bg-white px-4 py-4 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  )
}
