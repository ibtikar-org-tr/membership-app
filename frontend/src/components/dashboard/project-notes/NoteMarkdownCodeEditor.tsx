import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { EditorView } from '@codemirror/view'
import { useMemo } from 'react'

interface NoteMarkdownCodeEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

const editorFillTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    lineHeight: '1.6',
  },
  '.cm-content': {
    paddingTop: '1rem',
    paddingBottom: '1rem',
    minHeight: '100%',
  },
  '.cm-gutters': {
    border: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
})

export function NoteMarkdownCodeEditor({
  value,
  onChange,
  readOnly = false,
}: NoteMarkdownCodeEditorProps) {
  const extensions = useMemo(() => [markdown(), editorFillTheme, EditorView.lineWrapping], [])

  return (
    <div className="h-full min-h-0 w-full overflow-hidden bg-[#1e1e1e]" dir="ltr">
      <CodeMirror
        value={value}
        height="100%"
        theme={vscodeDark}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
          syntaxHighlighting: true,
        }}
        onChange={onChange}
        aria-label="مصدر Markdown للملاحظة"
        className="h-full [&_.cm-editor]:h-full"
      />
    </div>
  )
}
