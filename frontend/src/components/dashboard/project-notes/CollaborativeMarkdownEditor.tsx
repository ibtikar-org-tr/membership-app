import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { EditorView } from '@codemirror/view'
import { yCollab } from 'y-codemirror.next'
import * as Y from 'yjs'
import type * as awarenessProtocol from 'y-protocols/awareness'
import { useEffect, useMemo, useRef } from 'react'
import { NoteOnlineUsers, type ResolvedOnlineUser } from './NoteOnlineUsers'

interface CollaborativeMarkdownEditorProps {
  noteId: string
  yDoc: Y.Doc | null
  awareness: awarenessProtocol.Awareness | null
  initialContent?: string
  readOnly?: boolean
  connectionState: 'idle' | 'connecting' | 'connected' | 'error'
  isSynced?: boolean
  onlineUsers: ResolvedOnlineUser[]
}

const editorFillTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineHeight: '1.65',
  },
  '.cm-content': {
    paddingTop: '1rem',
    paddingBottom: '1.5rem',
    minHeight: '100%',
  },
  '.cm-gutters': {
    border: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
})

function connectionLabel(
  connectionState: CollaborativeMarkdownEditorProps['connectionState'],
  readOnly: boolean,
) {
  if (readOnly) {
    return 'وضع المشاهدة فقط'
  }

  switch (connectionState) {
    case 'connected':
      return 'متصل — Markdown مشترك'
    case 'connecting':
      return 'جار إعادة الاتصال...'
    case 'error':
      return 'تعذر الاتصال — سيتم إعادة المحاولة تلقائياً'
    default:
      return 'في انتظار الاتصال'
  }
}

export function CollaborativeMarkdownEditor({
  noteId,
  yDoc,
  awareness,
  initialContent = '',
  readOnly = false,
  connectionState,
  isSynced = false,
  onlineUsers,
}: CollaborativeMarkdownEditorProps) {
  const hasSeededRef = useRef(false)
  const seedNoteIdRef = useRef<string | null>(null)
  const yText = useMemo(() => (yDoc ? yDoc.getText('markdown') : null), [yDoc])

  useEffect(() => {
    if (seedNoteIdRef.current !== noteId) {
      seedNoteIdRef.current = noteId
      hasSeededRef.current = false
    }
  }, [noteId])

  useEffect(() => {
    if (!yText || readOnly || !isSynced || hasSeededRef.current) {
      return
    }

    if (yText.length > 0) {
      hasSeededRef.current = true
      return
    }

    const seed = initialContent.trim()
    if (!seed) {
      hasSeededRef.current = true
      return
    }

    yText.insert(0, seed)
    hasSeededRef.current = true
  }, [initialContent, isSynced, readOnly, yText])

  const extensions = useMemo(() => {
    const base = [markdown(), editorFillTheme, EditorView.lineWrapping]

    if (!yText || !awareness || readOnly) {
      return base
    }

    return [...base, yCollab(yText, awareness, { undoManager: new Y.UndoManager(yText) })]
  }, [awareness, readOnly, yText])

  const canEdit = Boolean(yText && awareness && !readOnly)
  const statusTone =
    readOnly || connectionState === 'connected'
      ? 'text-[#615d59]'
      : connectionState === 'error'
        ? 'text-red-600'
        : 'text-[#dd5b00]'

  const readOnlyValue = readOnly ? initialContent : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e6e6e6] bg-white shadow-[rgba(0,0,0,0.01)_0_0.175px_1.041px,rgba(0,0,0,0.02)_0_0.8px_2.925px,rgba(0,0,0,0.027)_0_2.025px_7.847px,rgba(0,0,0,0.04)_0_4px_18px]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e6e6e6] px-4 py-2.5">
        <div className={`flex items-center gap-2 text-[12px] font-medium ${statusTone}`}>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              readOnly
                ? 'bg-[#a39e98]'
                : connectionState === 'connected'
                  ? 'bg-[#1aae39]'
                  : connectionState === 'connecting'
                    ? 'animate-pulse bg-[#dd5b00]'
                    : connectionState === 'error'
                      ? 'bg-red-500'
                      : 'bg-[#a39e98]'
            }`}
            aria-hidden
          />
          <span>{connectionLabel(connectionState, readOnly)}</span>
          <span className="rounded-full bg-[#f6f5f4] px-2 py-0.5 text-[11px] font-semibold text-[#0075de]">
            Markdown
          </span>
        </div>
        {!readOnly ? <NoteOnlineUsers users={onlineUsers} className="mt-0" /> : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#1e1e1e]" dir="ltr">
        {!readOnly && !canEdit ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]/80 text-[15px] text-[#a39e98]">
            جار تجهيز محرر Markdown...
          </div>
        ) : null}

        {readOnly ? (
          <CodeMirror
            value={readOnlyValue ?? ''}
            height="100%"
            theme={vscodeDark}
            extensions={[markdown(), editorFillTheme, EditorView.lineWrapping]}
            editable={false}
            readOnly
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
              bracketMatching: true,
              autocompletion: false,
            }}
            className="h-full [&_.cm-editor]:h-full"
          />
        ) : yText ? (
          <CodeMirror
            height="100%"
            theme={vscodeDark}
            extensions={extensions}
            editable={canEdit}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              indentOnInput: true,
              syntaxHighlighting: true,
            }}
            className="h-full [&_.cm-editor]:h-full"
          />
        ) : null}
      </div>
    </div>
  )
}
