import { useState } from 'react'
import { FiPlus, FiTrash2, FiZap } from 'react-icons/fi'
import type { VmsProjectMember } from '../../../types/vms'

export interface AiGeneratedTaskDraft {
  name: string
  description: string
  priority: 'low' | 'medium' | 'high'
  subtasks: string[]
}

interface AiAddTaskModalProps {
  isGenerating: boolean
  isCreating: boolean
  generateError: string | null
  createError: string | null
  memberOptions: VmsProjectMember[]
  onClose: () => void
  onGenerate: (prompt: string) => Promise<AiGeneratedTaskDraft | null>
  onCreate: (draft: AiGeneratedTaskDraft & { assignedTo?: string; points: number }) => Promise<void>
}

const emptyDraft = (): AiGeneratedTaskDraft => ({
  name: '',
  description: '',
  priority: 'medium',
  subtasks: [],
})

export function AiAddTaskModal({
  isGenerating,
  isCreating,
  generateError,
  createError,
  memberOptions,
  onClose,
  onGenerate,
  onCreate,
}: AiAddTaskModalProps) {
  const [phase, setPhase] = useState<'prompt' | 'review'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState<AiGeneratedTaskDraft>(emptyDraft)
  const [assignedTo, setAssignedTo] = useState('')
  const [points, setPoints] = useState(1)
  const [localError, setLocalError] = useState<string | null>(null)

  const isBusy = isGenerating || isCreating

  const handleGenerate = async () => {
    setLocalError(null)
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setLocalError('يرجى وصف المهمة المطلوبة.')
      return
    }

    const generated = await onGenerate(trimmedPrompt)
    if (!generated) {
      return
    }

    setDraft(generated)
    setPhase('review')
  }

  const handleCreate = async () => {
    setLocalError(null)
    const name = draft.name.trim()
    if (!name) {
      setLocalError('يرجى إدخال عنوان المهمة.')
      return
    }

    if (points < 1) {
      setLocalError('يجب أن تكون النقاط 1 على الأقل.')
      return
    }

    const subtasks = draft.subtasks.map((item) => item.trim()).filter(Boolean)

    await onCreate({
      name,
      description: draft.description.trim(),
      priority: draft.priority,
      subtasks,
      assignedTo: assignedTo.trim() || undefined,
      points: Math.max(1, Math.trunc(points)),
    })
  }

  const updateSubtask = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      subtasks: current.subtasks.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
  }

  const addSubtask = () => {
    setDraft((current) => ({
      ...current,
      subtasks: [...current.subtasks, ''],
    }))
  }

  const removeSubtask = (index: number) => {
    setDraft((current) => ({
      ...current,
      subtasks: current.subtasks.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const displayError = localError ?? createError ?? generateError

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
    >
      <article
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 bg-linear-to-l from-violet-50 via-white to-cyan-50 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
                <FiZap className="h-5 w-5 text-violet-600" aria-hidden />
                إنشاء مهمة بالذكاء الاصطناعي
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {phase === 'prompt'
                  ? 'صف ما تحتاج إنجازه وسيقترح الذكاء الاصطناعي مهمة رئيسية ومهام فرعية.'
                  : 'راجع الاقتراح وعدّله قبل الحفظ.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:opacity-60"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {phase === 'prompt' ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-500">وصف المطلوب</label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="مثال: أحتاج مهمة لتنظيم ورشة عمل عن الذكاء الاصطناعي للمبتدئين، تشمل التحضير والترويج وتقييم الحضور..."
                  className="min-h-40 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  rows={6}
                  disabled={isBusy}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isBusy}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerate()}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
                >
                  <FiZap className="h-4 w-4" aria-hidden />
                  {isGenerating ? 'جار التوليد...' : 'توليد المهمة'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500">البيانات الأساسية</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">عنوان المهمة</label>
                    <input
                      value={draft.name}
                      onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      disabled={isBusy}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">الأولوية</label>
                    <select
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          priority: event.target.value as AiGeneratedTaskDraft['priority'],
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      disabled={isBusy}
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">التكليف</label>
                    <select
                      value={assignedTo}
                      onChange={(event) => setAssignedTo(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      disabled={isBusy}
                    >
                      <option value="">غير مسند</option>
                      {memberOptions.map((member) => (
                        <option key={member.membershipNumber} value={member.membershipNumber}>
                          {member.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">النقاط</label>
                    <input
                      type="number"
                      min={1}
                      value={points}
                      onChange={(event) => setPoints(Number(event.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <label className="mb-1 block text-xs font-medium text-slate-600">وصف المهمة</label>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                  rows={3}
                  disabled={isBusy}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-wide text-slate-500">المهام الفرعية</p>
                  <button
                    type="button"
                    onClick={addSubtask}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <FiPlus className="h-3.5 w-3.5" aria-hidden />
                    إضافة
                  </button>
                </div>
                {draft.subtasks.length === 0 ? (
                  <p className="text-sm text-slate-500">لا توجد مهام فرعية. يمكنك إضافتها يدوياً.</p>
                ) : (
                  <ul className="space-y-2">
                    {draft.subtasks.map((subtask, index) => (
                      <li key={`ai-subtask-${index}`} className="flex items-center gap-2">
                        <input
                          value={subtask}
                          onChange={(event) => updateSubtask(index, event.target.value)}
                          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                          disabled={isBusy}
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtask(index)}
                          disabled={isBusy}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          aria-label="حذف المهمة الفرعية"
                        >
                          <FiTrash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('prompt')
                    setLocalError(null)
                  }}
                  disabled={isBusy}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60"
                >
                  تعديل الوصف
                </button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isBusy}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={isBusy}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isCreating ? 'جار الإنشاء...' : 'إنشاء المهمة'}
                  </button>
                </div>
              </div>
            </>
          )}

          {displayError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{displayError}</p>
          ) : null}
        </div>
      </article>
    </div>
  )
}
