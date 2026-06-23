import type { Editor } from '@tiptap/react'
import {
  FiAlignLeft,
  FiBold,
  FiItalic,
  FiList,
  FiType,
  FiUnderline,
} from 'react-icons/fi'

const toolbarBtn =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-transparent px-2 text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
const toolbarBtnActive = 'border-slate-200 bg-slate-100 text-slate-900'

interface NoteEditorToolbarProps {
  editor: Editor | null
  disabled?: boolean
}

export function NoteEditorToolbar({ editor, disabled = false }: NoteEditorToolbarProps) {
  if (!editor) {
    return null
  }

  const blockLabel = editor.isActive('heading', { level: 1 })
    ? 'عنوان 1'
    : editor.isActive('heading', { level: 2 })
      ? 'عنوان 2'
      : editor.isActive('heading', { level: 3 })
        ? 'عنوان 3'
        : 'فقرة'

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
        <FiType className="h-3.5 w-3.5 opacity-70" aria-hidden />
        <select
          disabled={disabled}
          value={
            editor.isActive('heading', { level: 1 })
              ? 'h1'
              : editor.isActive('heading', { level: 2 })
                ? 'h2'
                : editor.isActive('heading', { level: 3 })
                  ? 'h3'
                  : 'paragraph'
          }
          onChange={(event) => {
            const value = event.target.value
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run()
              return
            }

            const level = Number(value.replace('h', '')) as 1 | 2 | 3
            editor.chain().focus().setHeading({ level }).run()
          }}
          className="bg-transparent text-xs outline-none"
          aria-label="نوع النص"
        >
          <option value="paragraph">{blockLabel === 'فقرة' ? 'فقرة' : blockLabel}</option>
          <option value="h1">عنوان 1</option>
          <option value="h2">عنوان 2</option>
          <option value="h3">عنوان 3</option>
        </select>
      </label>

      <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
        <FiAlignLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
        <select
          disabled={disabled}
          value={editor.getAttributes('textStyle').fontSize ?? 'default'}
          onChange={(event) => {
            const value = event.target.value
            if (value === 'default') {
              editor.chain().focus().unsetMark('textStyle').run()
              return
            }

            editor.chain().focus().setMark('textStyle', { fontSize: value }).run()
          }}
          className="bg-transparent text-xs outline-none"
          aria-label="حجم الخط"
        >
          <option value="default">الحجم الافتراضي</option>
          <option value="12px">صغير</option>
          <option value="16px">عادي</option>
          <option value="20px">كبير</option>
          <option value="28px">عنوان</option>
        </select>
      </label>

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
