import type { Editor } from '@tiptap/react'
import { useEffect, useState } from 'react'
import {
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiCode,
  FiEdit3,
  FiItalic,
  FiList,
  FiUnderline,
} from 'react-icons/fi'
import { Sparkles } from 'lucide-react'
import { getActiveTextDirection } from './note-text-direction'

export type NoteEditorViewMode = 'visual' | 'html' | 'markdown'
export type NoteEditorSourceKind = 'html' | 'markdown'

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72] as const
const DEFAULT_FONT_SIZE = '16px'

function fontSizeOptionValue(size: number) {
  return `${size}px`
}

function parseFontSizePx(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = /^(\d+(?:\.\d+)?)px$/.exec(value)
  return match ? Number(match[1]) : null
}

const toolbarBtn =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent px-2 text-[#615d59] transition hover:bg-black/5 hover:text-[#31302e] disabled:cursor-not-allowed disabled:opacity-40'
const toolbarBtnActive = 'bg-black/5 text-black'

const modeBtn =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition'
const modeBtnIdle = 'text-[#615d59] hover:bg-white hover:text-[#31302e]'
const modeBtnActive = 'bg-white text-black shadow-[rgba(0,0,0,0.04)_0_4px_18px]'

interface NoteEditorToolbarProps {
  editor: Editor | null
  disabled?: boolean
  viewMode: NoteEditorViewMode
  sourceKind?: NoteEditorSourceKind
  onViewModeChange: (mode: NoteEditorViewMode) => void
  modeSwitchDisabled?: boolean
  onBeautifySource?: () => void
  beautifyDisabled?: boolean
}

export function NoteEditorToolbar({
  editor,
  disabled = false,
  viewMode,
  sourceKind = 'html',
  onViewModeChange,
  modeSwitchDisabled = false,
  onBeautifySource,
  beautifyDisabled = false,
}: NoteEditorToolbarProps) {
  const [toolbarRevision, setToolbarRevision] = useState(0)
  const sourceMode: NoteEditorViewMode = sourceKind === 'markdown' ? 'markdown' : 'html'
  const isSourceMode = viewMode === sourceMode

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
        onClick={() => onViewModeChange(sourceMode)}
        className={`${modeBtn} ${isSourceMode ? modeBtnActive : modeBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
        title={sourceKind === 'markdown' ? 'تحرير Markdown' : 'تحرير HTML'}
      >
        <FiCode className="h-3.5 w-3.5" aria-hidden />
        {sourceKind === 'markdown' ? 'Markdown' : 'HTML'}
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
          title={sourceKind === 'markdown' ? 'تنسيق Markdown' : 'تنسيق HTML'}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Beautify
        </button>
        <p className="text-[12px] text-[#615d59]">
          {sourceKind === 'markdown'
            ? 'عدّل الـ Markdown ثم ارجع للوضع المرئي لتطبيق التغييرات.'
            : 'عدّل الـ HTML ثم ارجع للوضع المرئي لتطبيق التغييرات.'}
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

  const activeDirection = getActiveTextDirection(editor)
  const markedFontSize = editor.getAttributes('textStyle').fontSize as string | undefined
  const activeFontSize = markedFontSize ?? DEFAULT_FONT_SIZE
  const parsedActiveSize = parseFontSizePx(activeFontSize)
  const isKnownSize =
    parsedActiveSize !== null && FONT_SIZES.includes(parsedActiveSize as (typeof FONT_SIZES)[number])

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#e6e6e6] bg-[#f6f5f4] px-3 py-2">
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

      <span className="mx-1 h-6 w-px bg-[#e6e6e6]" aria-hidden />

      <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e6e6] bg-white px-2 py-1 text-[12px] font-medium text-[#31302e]">
        <select
          disabled={disabled}
          value={isKnownSize ? activeFontSize : markedFontSize ?? DEFAULT_FONT_SIZE}
          onChange={(event) => {
            const value = event.target.value
            if (value === DEFAULT_FONT_SIZE) {
              editor.chain().focus().unsetMark('textStyle').run()
              return
            }

            editor.chain().focus().setMark('textStyle', { fontSize: value }).run()
          }}
          className="cursor-pointer bg-transparent text-[12px] outline-none"
          aria-label="حجم الخط"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={fontSizeOptionValue(size)}>
              {size}
            </option>
          ))}
          {!isKnownSize && markedFontSize ? (
            <option value={markedFontSize}>{parsedActiveSize ?? markedFontSize}</option>
          ) : null}
        </select>
      </label>

      <span className="mx-1 h-6 w-px bg-[#e6e6e6]" aria-hidden />

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

      {modeSwitcher}
    </div>
  )
}
