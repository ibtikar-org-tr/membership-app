import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import {
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiItalic,
  FiList,
  FiUnderline,
} from 'react-icons/fi'
import { getActiveTextDirection } from './note-text-direction'

const toolbarBtn =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-transparent px-2 text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
const toolbarBtnActive = 'border-slate-200 bg-slate-100 text-slate-900'

interface NoteEditorToolbarProps {
  editor: Editor | null
  disabled?: boolean
}

export function NoteEditorToolbar({ editor, disabled = false }: NoteEditorToolbarProps) {
  const [toolbarRevision, setToolbarRevision] = useState(0)

  useEffect(() => {
    if (!editor) {
      return
    }

    const refreshToolbar = () => {
      setToolbarRevision((value) => value + 1)
    }

    editor.on('selectionUpdate', refreshToolbar)
    editor.on('transaction', refreshToolbar)

    return () => {
      editor.off('selectionUpdate', refreshToolbar)
      editor.off('transaction', refreshToolbar)
    }
  }, [editor])

  if (!editor) {
    return null
  }

  void toolbarRevision

  const activeDirection = getActiveTextDirection(editor)
  const activeFontSize = editor.getAttributes('textStyle').fontSize ?? '16px'

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${toolbarBtn} ${editor.isActive('bold') ? toolbarBtnActive : ''}`}
        title="عريض"
      >
        <FiBold className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${toolbarBtn} ${editor.isActive('italic') ? toolbarBtnActive : ''}`}
        title="مائل"
      >
        <FiItalic className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleUnderline().run()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`${toolbarBtn} ${editor.isActive('underline') ? toolbarBtnActive : ''}`}
        title="تحته خط"
      >
        <FiUnderline className="h-4 w-4" aria-hidden />
      </button>

      <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

      <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
        <select
          disabled={disabled}
          value={activeFontSize}
          onChange={(event) => {
            const value = event.target.value
            if (value === '16px') {
              editor.chain().focus().unsetMark('textStyle').run()
              return
            }

            editor.chain().focus().setMark('textStyle', { fontSize: value }).run()
          }}
          className="bg-transparent text-xs outline-none"
          aria-label="حجم الخط"
        >
          <option value="12px">12</option>
          <option value="16px">16</option>
          <option value="20px">20</option>
          <option value="28px">28</option>
        </select>
      </label>

      <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextDirection('rtl').run()}
        className={`${toolbarBtn} ${activeDirection === 'rtl' ? toolbarBtnActive : ''}`}
        title="من اليمين لليسار"
      >
        <FiAlignRight className="h-4 w-4" aria-hidden />
        <span className="ms-1 text-[10px] font-bold">RTL</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextDirection('ltr').run()}
        className={`${toolbarBtn} ${activeDirection === 'ltr' ? toolbarBtnActive : ''}`}
        title="من اليسار لليمين"
      >
        <FiAlignLeft className="h-4 w-4" aria-hidden />
        <span className="ms-1 text-[10px] font-bold">LTR</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setTextDirection('auto').run()}
        className={`${toolbarBtn} ${activeDirection === 'auto' ? toolbarBtnActive : ''}`}
        title="اتجاه تلقائي"
      >
        <span className="text-[10px] font-bold">Auto</span>
      </button>

      <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden />

      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${toolbarBtn} ${editor.isActive('bulletList') ? toolbarBtnActive : ''}`}
        title="قائمة نقطية"
      >
        <FiList className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${toolbarBtn} ${editor.isActive('orderedList') ? toolbarBtnActive : ''}`}
        title="قائمة مرقمة"
      >
        <span className="text-xs font-bold">1.</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${toolbarBtn} ${editor.isActive('blockquote') ? toolbarBtnActive : ''}`}
        title="اقتباس"
      >
        <span className="text-sm leading-none">"</span>
      </button>
    </div>
  )
}
