import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import type * as awarenessProtocol from 'y-protocols/awareness'
import type * as Y from 'yjs'
import { plainTextToHtml } from '../../../utils/yjs-rich-text'
import { NoteEditorToolbar, type NoteEditorViewMode } from './NoteEditorToolbar'
import { formatNoteHtmlForEditing, normalizeNoteHtmlInput } from './note-html-source'
import { NoteFontSize } from './note-font-size'
import { NoteOnlineUsers, type ResolvedOnlineUser } from './NoteOnlineUsers'
import { NoteTextDirection } from './note-text-direction'
import { createNoteMemberMention } from './note-member-mention'
import type { MentionableMember } from './mentionable-members'

interface CollaborativeNoteEditorProps {
  noteId: string
  yDoc: Y.Doc | null
  awareness: awarenessProtocol.Awareness | null
  initialContent?: string
  readOnly?: boolean
  connectionState: 'idle' | 'connecting' | 'connected' | 'error'
  onlineUsers: ResolvedOnlineUser[]
  memberColor: string
  displayName: string
  membershipNumber: string
  mentionableMembers: MentionableMember[]
}

const editorSurfaceClass =
  '[&_.ProseMirror]:min-h-88 [&_.ProseMirror]:px-5 [&_.ProseMirror]:py-5 [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-8 [&_.ProseMirror]:text-slate-800 [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-2 [&_.ProseMirror_h1]:my-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:my-2.5 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:my-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ps-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ps-6 [&_.ProseMirror_blockquote]:my-3 [&_.ProseMirror_blockquote]:border-s-4 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:ps-4 [&_.ProseMirror_blockquote]:text-slate-600 [&_.ProseMirror_.is-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-empty:first-child::before]:float-left [&_.ProseMirror_.is-empty:first-child::before]:h-0 [&_.ProseMirror_.is-empty:first-child::before]:text-slate-400 [&_.ProseMirror_.is-empty:first-child::before]:content-[attr(data-placeholder)]'

function connectionLabel(connectionState: CollaborativeNoteEditorProps['connectionState'], readOnly: boolean) {
  if (readOnly) {
    return 'وضع المشاهدة فقط'
  }

  switch (connectionState) {
    case 'connected':
      return 'متصل — التعديلات تُزامَن مباشرة'
    case 'connecting':
      return 'جار إعادة الاتصال...'
    case 'error':
      return 'تعذر الاتصال — سيتم إعادة المحاولة تلقائياً'
    default:
      return 'في انتظار الاتصال'
  }
}

export function CollaborativeNoteEditor({
  noteId,
  yDoc,
  awareness,
  initialContent = '',
  readOnly = false,
  connectionState,
  onlineUsers,
  memberColor,
  displayName,
  membershipNumber,
  mentionableMembers,
}: CollaborativeNoteEditorProps) {
  const hasSeededRef = useRef(false)
  const seedNoteIdRef = useRef<string | null>(null)
  const mentionableMembersRef = useRef(mentionableMembers)
  const htmlDirtyRef = useRef(false)
  const [viewMode, setViewMode] = useState<NoteEditorViewMode>('visual')
  const [htmlSource, setHtmlSource] = useState('')
  const [htmlApplyError, setHtmlApplyError] = useState<string | null>(null)

  mentionableMembersRef.current = mentionableMembers

  const memberMentionExtension = useMemo(
    () => createNoteMemberMention(() => mentionableMembersRef.current),
    [],
  )

  const isCollaborative = Boolean(yDoc && awareness && !readOnly)
  // Keep editing available while reconnecting so a dropped socket cannot freeze the UI.
  const canEdit = isCollaborative

  const staticContent = useMemo(() => plainTextToHtml(initialContent), [initialContent])

  const editor = useEditor(
    {
      editable: isCollaborative,
      extensions: isCollaborative
        ? [
            StarterKit.configure({
              history: false,
            }),
            Underline,
            NoteFontSize,
            NoteTextDirection,
            memberMentionExtension,
            Placeholder.configure({
              placeholder: 'ابدأ الكتابة... اكتب @ للإشارة إلى عضو في المشروع.',
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
            NoteTextDirection,
            memberMentionExtension,
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
    // Intentionally omit connectionState — remounting on reconnect orphaned Tippy overlays and froze clicks.
    [noteId, readOnly, isCollaborative, yDoc, awareness, memberColor, displayName],
  )

  useEffect(() => {
    if (seedNoteIdRef.current !== noteId) {
      seedNoteIdRef.current = noteId
      hasSeededRef.current = false
      setViewMode('visual')
      setHtmlSource('')
      setHtmlApplyError(null)
      htmlDirtyRef.current = false
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

    // Avoid remote caret churn into the HTML textarea while the user is editing source.
    editor.setEditable(canEdit && viewMode === 'visual')
  }, [canEdit, editor, viewMode])

  useEffect(() => {
    if (!editor || !readOnly) {
      return
    }

    editor.commands.setContent(staticContent, false)
  }, [editor, readOnly, staticContent])

  useEffect(() => {
    if (!editor || !awareness || readOnly) {
      return
    }

    awareness.setLocalStateField('notePresence', {
      membershipNumber,
      displayName,
    })
  }, [awareness, displayName, editor, membershipNumber, readOnly])

  useEffect(() => {
    return () => {
      // Safety net: destroy any leftover Tippy layers if the suggestion onExit raced a remount.
      document.querySelectorAll('[data-tippy-root]').forEach((node) => {
        node.remove()
      })
    }
  }, [noteId])

  // Keep the HTML pane in sync with collaborative visual edits until the user edits the source.
  useEffect(() => {
    if (!editor || viewMode !== 'html' || htmlDirtyRef.current) {
      return
    }

    const syncHtmlFromEditor = () => {
      if (htmlDirtyRef.current) {
        return
      }

      setHtmlSource(formatNoteHtmlForEditing(editor.getHTML()))
    }

    syncHtmlFromEditor()
    editor.on('update', syncHtmlFromEditor)

    return () => {
      editor.off('update', syncHtmlFromEditor)
    }
  }, [editor, viewMode])

  const resolveCurrentHtml = () => {
    if (editor) {
      return formatNoteHtmlForEditing(editor.getHTML())
    }

    if (readOnly) {
      return formatNoteHtmlForEditing(staticContent)
    }

    return formatNoteHtmlForEditing(plainTextToHtml(initialContent))
  }

  const handleViewModeChange = (nextMode: NoteEditorViewMode) => {
    if (nextMode === viewMode) {
      return
    }

    setHtmlApplyError(null)

    if (nextMode === 'html') {
      htmlDirtyRef.current = false
      setHtmlSource(resolveCurrentHtml())
      setViewMode('html')
      return
    }

    // Apply HTML → visual (and into Yjs when collaborative).
    if (!editor) {
      setViewMode('visual')
      return
    }

    if (readOnly || !canEdit) {
      htmlDirtyRef.current = false
      setViewMode('visual')
      return
    }

    try {
      const normalized = normalizeNoteHtmlInput(htmlSource)
      const applied = editor.commands.setContent(normalized, true)

      if (!applied) {
        setHtmlApplyError('تعذر تطبيق HTML. تحقق من صحة الوسوم ثم حاول مرة أخرى.')
        return
      }

      htmlDirtyRef.current = false
      setHtmlSource(formatNoteHtmlForEditing(editor.getHTML()))
      setViewMode('visual')
    } catch {
      setHtmlApplyError('تعذر تطبيق HTML. تحقق من صحة الوسوم ثم حاول مرة أخرى.')
    }
  }

  const statusTone =
    readOnly || connectionState === 'connected'
      ? 'text-slate-600'
      : connectionState === 'error'
        ? 'text-red-600'
        : 'text-amber-700'

  return (
    <div className="flex min-h-96 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
        .note-rich-text .note-mention {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0 0.45rem;
          font-size: 0.875em;
          font-weight: 600;
          color: rgb(51 65 85);
          white-space: nowrap;
        }
        .tippy-box {
          background: transparent;
          color: inherit;
          font-size: inherit;
          line-height: inherit;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }
        .tippy-content {
          padding: 0;
        }
        .tippy-box[data-placement^='top'] > .tippy-arrow,
        .tippy-box[data-placement^='bottom'] > .tippy-arrow {
          display: none;
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
        <div className={`flex items-center gap-2 text-xs font-medium ${statusTone}`}>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              readOnly
                ? 'bg-slate-300'
                : connectionState === 'connected'
                  ? 'bg-emerald-500'
                  : connectionState === 'connecting'
                    ? 'animate-pulse bg-amber-400'
                    : connectionState === 'error'
                      ? 'bg-red-500'
                      : 'bg-slate-300'
            }`}
            aria-hidden
          />
          <span>{connectionLabel(connectionState, readOnly)}</span>
        </div>
        {!readOnly ? <NoteOnlineUsers users={onlineUsers} className="mt-0" /> : null}
      </div>

      <NoteEditorToolbar
        editor={editor}
        disabled={!canEdit || viewMode !== 'visual'}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        modeSwitchDisabled={!editor && !readOnly}
      />

      {htmlApplyError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{htmlApplyError}</div>
      ) : null}

      <div className={`relative flex-1 overflow-auto ${viewMode === 'visual' ? editorSurfaceClass : ''}`}>
        {!readOnly && !isCollaborative ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-slate-600 backdrop-blur-[1px]">
            جار تجهيز المحرر...
          </div>
        ) : null}

        {viewMode === 'html' ? (
          <textarea
            value={htmlSource}
            readOnly={readOnly || !canEdit}
            onChange={(event) => {
              htmlDirtyRef.current = true
              setHtmlApplyError(null)
              setHtmlSource(event.target.value)
            }}
            spellCheck={false}
            dir="ltr"
            className="min-h-88 w-full resize-y border-0 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-emerald-100 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="<p>...</p>"
            aria-label="مصدر HTML للملاحظة"
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  )
}
