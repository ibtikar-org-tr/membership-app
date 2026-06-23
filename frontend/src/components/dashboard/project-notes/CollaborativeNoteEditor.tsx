import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import type { NoteCollaborator } from '../../../hooks/useProjectNoteCollaboration'
import type * as awarenessProtocol from 'y-protocols/awareness'
import type * as Y from 'yjs'
import { plainTextToHtml } from '../../../utils/yjs-rich-text'
import { NoteEditorToolbar } from './NoteEditorToolbar'
import { NoteFontSize } from './note-font-size'

interface CollaborativeNoteEditorProps {
  noteId: string
  yDoc: Y.Doc | null
  awareness: awarenessProtocol.Awareness | null
  initialContent?: string
  readOnly?: boolean
  connectionState: 'idle' | 'connecting' | 'connected' | 'error'
  collaborators: NoteCollaborator[]
  memberColor: string
  displayName: string
}

const editorSurfaceClass =
  '[&_.ProseMirror]:min-h-88 [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-4 [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-8 [&_.ProseMirror]:text-slate-800 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 [&_.ProseMirror_h1]:my-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:my-2.5 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:my-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ps-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ps-6 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-s-4 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:ps-4 [&_.ProseMirror_blockquote]:text-slate-600 [&_.ProseMirror_.is-empty:first-child::before]:text-slate-400'

export function CollaborativeNoteEditor({
  noteId,
  yDoc,
  awareness,
  initialContent = '',
  readOnly = false,
  connectionState,
  collaborators,
  memberColor,
  displayName,
}: CollaborativeNoteEditorProps) {
  const hasSeededRef = useRef(false)
  const seedNoteIdRef = useRef<string | null>(null)

  const isCollaborative = Boolean(yDoc && awareness && !readOnly)
  const canEdit = isCollaborative && connectionState === 'connected'

  const staticContent = useMemo(() => plainTextToHtml(initialContent), [initialContent])

  const editor = useEditor(
    {
      editable: readOnly ? false : connectionState === 'connected',
      extensions: isCollaborative
        ? [
            StarterKit.configure({
              history: false,
            }),
            Underline,
            NoteFontSize,
            Placeholder.configure({
              placeholder: 'ابدأ الكتابة... سيتم مزامنة التغييرات والتنسيق مع فريق المشروع مباشرة.',
            }),
            Collaboration.configure({
              document: yDoc!,
            }),
            CollaborationCursor.configure({
              provider: {
                awareness: awareness!,
              },
              user: {
                name: displayName,
                color: memberColor,
              },
            }),
          ]
        : [
            StarterKit,
            Underline,
            NoteFontSize,
            Placeholder.configure({
              placeholder: readOnly ? 'يمكنك مشاهدة هذه الملاحظة فقط.' : 'جار تحميل المحرر...',
            }),
          ],
      content: readOnly ? staticContent : undefined,
      editorProps: {
        attributes: {
          class: 'note-rich-text',
          dir: 'auto',
        },
      },
    },
    [noteId, readOnly, isCollaborative, yDoc, awareness, memberColor, displayName, connectionState],
  )

  useEffect(() => {
    if (seedNoteIdRef.current !== noteId) {
      seedNoteIdRef.current = noteId
      hasSeededRef.current = false
    }
  }, [noteId])

  useEffect(() => {
    if (!editor || !yDoc || readOnly || connectionState !== 'connected' || hasSeededRef.current) {
      return
    }

    const fragment = yDoc.getXmlFragment('default')
    if (fragment.length > 0) {
      hasSeededRef.current = true
      return
    }

    if (!initialContent.trim()) {
      hasSeededRef.current = true
      return
    }

    editor.commands.setContent(plainTextToHtml(initialContent), false)
    hasSeededRef.current = true
  }, [connectionState, editor, initialContent, readOnly, yDoc])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.setEditable(!readOnly && connectionState === 'connected')
  }, [connectionState, editor, readOnly])

  useEffect(() => {
    if (!editor || !readOnly) {
      return
    }

    editor.commands.setContent(staticContent, false)
  }, [editor, readOnly, staticContent])

  const uniqueCollaborators = collaborators.reduce<NoteCollaborator[]>((accumulator, collaborator) => {
    if (accumulator.some((item) => item.membershipNumber === collaborator.membershipNumber)) {
      return accumulator
    }

    accumulator.push(collaborator)
    return accumulator
  }, [])

  return (
    <div className="flex min-h-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <style>{`
        .note-rich-text .collaboration-cursor__caret {
          position: relative;
          margin-inline: -1px;
          border-inline-start-width: 2px;
          border-inline-start-style: solid;
          pointer-events: none;
        }
        .note-rich-text .collaboration-cursor__label {
          position: absolute;
          top: -1.35em;
          inset-inline-start: -1px;
          padding: 2px 6px;
          border-radius: 4px 4px 4px 0;
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          color: #fff;
          white-space: nowrap;
          user-select: none;
          pointer-events: none;
        }
      `}</style>
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
          {readOnly
            ? 'وضع المشاهدة فقط'
            : connectionState === 'connected'
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

      <NoteEditorToolbar editor={editor} disabled={!canEdit} />

      <div className={`relative flex-1 overflow-auto ${editorSurfaceClass}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
