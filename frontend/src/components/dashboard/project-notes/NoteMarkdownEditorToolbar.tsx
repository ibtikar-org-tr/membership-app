import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import {
  FiBold,
  FiCode,
  FiEdit3,
  FiItalic,
  FiLink,
  FiList,
  FiMinus,
} from 'react-icons/fi'
import { Heading1, Heading2, Heading3, ListOrdered, Quote, Sparkles, Strikethrough } from 'lucide-react'
import type { NoteEditorViewMode } from './NoteEditorToolbar'

const toolbarBtn =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent px-2 text-[#615d59] transition hover:bg-black/5 hover:text-[#31302e] disabled:cursor-not-allowed disabled:opacity-40'
const toolbarBtnActive = 'bg-black/5 text-black'

const modeBtn =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition'
const modeBtnIdle = 'text-[#615d59] hover:bg-white hover:text-[#31302e]'
const modeBtnActive = 'bg-white text-black shadow-[rgba(0,0,0,0.04)_0_4px_18px]'

interface NoteMarkdownEditorToolbarProps {
  editor: Editor | null
  disabled?: boolean
  viewMode: NoteEditorViewMode
  onViewModeChange: (mode: NoteEditorViewMode) => void
  modeSwitchDisabled?: boolean
  onBeautifySource?: () => void
  beautifyDisabled?: boolean
}

function promptForLinkUrl(currentHref: string) {
  const next = window.prompt('رابط URL', currentHref || 'https://')
  if (next === null) {
    return null
  }

  const trimmed = next.trim()
  return trimmed
}

export function NoteMarkdownEditorToolbar({
  editor,
  disabled = false,
  viewMode,
  onViewModeChange,
  modeSwitchDisabled = false,
  onBeautifySource,
  beautifyDisabled = false,
}: NoteMarkdownEditorToolbarProps) {
  const [toolbarRevision, setToolbarRevision] = useState(0)
  const isSourceMode = viewMode === 'markdown'

  useEffect(() => {
    if (!editor || viewMode !== 'visual') {
      return
    }

    let frame = 0

    const refreshToolbar = () => {
      if (frame) {
        return
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0
        setToolbarRevision((value) => value + 1)
      })
    }

    editor.on('selectionUpdate', refreshToolbar)
    editor.on('transaction', refreshToolbar)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      editor.off('selectionUpdate', refreshToolbar)
      editor.off('transaction', refreshToolbar)
    }
  }, [editor, viewMode])

  const modeSwitcher = (
    <div
      className="ms-auto inline-flex items-center rounded-lg border border-[#e6e6e6] bg-[#f6f5f4] p-0.5"
      role="group"
      aria-label="وضع المحرر"
    >
      <button
        type="button"
        disabled={modeSwitchDisabled}
        onClick={() => onViewModeChange('visual')}
        className={`${modeBtn} ${viewMode === 'visual' ? modeBtnActive : modeBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
        title="المحرر المرئي"
      >
        <FiEdit3 className="h-3.5 w-3.5" aria-hidden />
        مرئي
      </button>
      <button
        type="button"
        disabled={modeSwitchDisabled}
        onClick={() => onViewModeChange('markdown')}
        className={`${modeBtn} ${isSourceMode ? modeBtnActive : modeBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
        title="تحرير Markdown"
      >
        <FiCode className="h-3.5 w-3.5" aria-hidden />
        Markdown
      </button>
    </div>
  )

  if (isSourceMode) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e6e6] bg-[#f6f5f4] px-3 py-2">
        <button
          type="button"
          disabled={beautifyDisabled || !onBeautifySource}
          onClick={() => onBeautifySource?.()}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e6e6e6] bg-white px-2.5 text-[12px] font-medium text-[#31302e] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          title="تنسيق Markdown"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Beautify
        </button>
        <p className="text-[12px] text-[#615d59]">
          عدّل الـ Markdown ثم ارجع للوضع المرئي لتطبيق التغييرات.
        </p>
        {modeSwitcher}
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e6e6e6] bg-[#f6f5f4] px-3 py-2">
        {modeSwitcher}
      </div>
    )
  }

  void toolbarRevision

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#e6e6e6] bg-[#f6f5f4] px-3 py-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${toolbarBtn} ${editor.isActive('heading', { level: 1 }) ? toolbarBtnActive : ''}`}
        title="عنوان 1"
      >
        <Heading1 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? toolbarBtnActive : ''}`}
        title="عنوان 2"
      >
        <Heading2 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? toolbarBtnActive : ''}`}
        title="عنوان 3"
      >
        <Heading3 className="h-4 w-4" aria-hidden />
      </button>

      <span className="mx-1 h-6 w-px bg-[#e6e6e6]" aria-hidden />

      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${toolbarBtn} ${editor.isActive('bold') ? toolbarBtnActive : ''}`}
        title="عريض **نص**"
      >
        <FiBold className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${toolbarBtn} ${editor.isActive('italic') ? toolbarBtnActive : ''}`}
        title="مائل *نص*"
      >
        <FiItalic className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleStrike().run()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${toolbarBtn} ${editor.isActive('strike') ? toolbarBtnActive : ''}`}
        title="يتوسطه خط ~~نص~~"
      >
        <Strikethrough className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || !editor.can().chain().focus().toggleCode().run()}
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`${toolbarBtn} ${editor.isActive('code') ? toolbarBtnActive : ''}`}
        title="كود مضمّن `نص`"
      >
        <FiCode className="h-4 w-4" aria-hidden />
      </button>

      <span className="mx-1 h-6 w-px bg-[#e6e6e6]" aria-hidden />

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
        <ListOrdered className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${toolbarBtn} ${editor.isActive('blockquote') ? toolbarBtnActive : ''}`}
        title="اقتباس >"
      >
        <Quote className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${toolbarBtn} ${editor.isActive('codeBlock') ? toolbarBtnActive : ''}`}
        title="كتلة كود ```"
      >
        <span className="font-mono text-[11px] font-bold leading-none">{'{}'}</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={toolbarBtn}
        title="خط فاصل ---"
      >
        <FiMinus className="h-4 w-4" aria-hidden />
      </button>

      <span className="mx-1 h-6 w-px bg-[#e6e6e6]" aria-hidden />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const previous = editor.getAttributes('link').href as string | undefined
          const nextUrl = promptForLinkUrl(previous ?? '')

          if (nextUrl === null) {
            return
          }

          if (!nextUrl) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }

          editor.chain().focus().extendMarkRange('link').setLink({ href: nextUrl }).run()
        }}
        className={`${toolbarBtn} ${editor.isActive('link') ? toolbarBtnActive : ''}`}
        title="رابط [نص](url)"
      >
        <FiLink className="h-4 w-4" aria-hidden />
      </button>

      {modeSwitcher}
    </div>
  )
}
