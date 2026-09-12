import { useState, type FormEvent } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { editProjectNoteWithAi } from '../../../api/vms'

interface NoteAiCommandBarProps {
  noteId: string
  contentType: 'html' | 'markdown'
  disabled?: boolean
  getContent: () => string
  onApplyContent: (content: string) => void
}

export function NoteAiCommandBar({
  noteId,
  contentType,
  disabled = false,
  getContent,
  onApplyContent,
}: NoteAiCommandBarProps) {
  const [command, setCommand] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmed = command.trim()
    if (!trimmed || disabled || isRunning) {
      return
    }

    setError(null)
    setSummary(null)
    setIsRunning(true)

    try {
      const { edited } = await editProjectNoteWithAi(noteId, {
        command: trimmed,
        content: getContent(),
        contentType,
      })

      onApplyContent(edited.content)
      setSummary(edited.summary?.trim() || 'تم تطبيق التعديل.')
      setCommand('')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'تعذر تعديل الملاحظة بالذكاء الاصطناعي.',
      )
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="shrink-0 border-b border-[#e6e6e6] bg-[#faf9f8] px-3 py-2">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-2.5 py-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#0075de]" aria-hidden />
          <input
            type="text"
            value={command}
            disabled={disabled || isRunning}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="أمر للذكاء الاصطناعي… مثال: اختصر النص، أضف عنواناً، ترجم للعربية"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#31302e] outline-none placeholder:text-[#a39e98] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="أمر تعديل الملاحظة بالذكاء الاصطناعي"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || isRunning || !command.trim()}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#31302e] px-3 text-[12px] font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          {isRunning ? 'جار التنفيذ...' : 'نفّذ'}
        </button>
      </form>

      {error ? <p className="mt-1.5 text-[12px] text-red-600">{error}</p> : null}
      {!error && summary ? <p className="mt-1.5 text-[12px] text-[#615d59]">{summary}</p> : null}
    </div>
  )
}
