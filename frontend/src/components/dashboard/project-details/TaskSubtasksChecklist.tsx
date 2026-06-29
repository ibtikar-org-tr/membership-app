import { useState, type FormEvent } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import type { VmsTaskSubtask } from '../../../types/vms'

interface TaskSubtasksChecklistProps {
  subtasks: VmsTaskSubtask[]
  canEdit: boolean
  isLoading: boolean
  loadingPlaceholderCount?: number
  error: string | null
  onCreateSubtask: (name: string) => Promise<void>
  onToggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>
  onRenameSubtask: (subtaskId: string, name: string) => Promise<void>
  onDeleteSubtask: (subtaskId: string) => Promise<void>
}

function SubtaskSkeletonRow() {
  return (
    <li className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
      <div className="h-4 w-4 shrink-0 animate-pulse rounded border border-slate-200 bg-slate-200" />
      <div className="h-4 min-w-0 flex-1 animate-pulse rounded bg-slate-200" />
    </li>
  )
}

export function TaskSubtasksChecklist({
  subtasks,
  canEdit,
  isLoading,
  loadingPlaceholderCount = 0,
  error,
  onCreateSubtask,
  onToggleSubtask,
  onRenameSubtask,
  onDeleteSubtask,
}: TaskSubtasksChecklistProps) {
  const [newSubtaskName, setNewSubtaskName] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const completedCount = subtasks.filter((subtask) => subtask.status === 'completed').length
  const allCompleted = subtasks.length > 0 && completedCount === subtasks.length
  const skeletonCount = Math.min(Math.max(loadingPlaceholderCount, subtasks.length > 0 ? 0 : 2), 6)
  const showSkeletons = isLoading && subtasks.length === 0 && skeletonCount > 0

  function handleAddSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = newSubtaskName.trim()
    if (!trimmedName || !canEdit) {
      return
    }

    setNewSubtaskName('')
    void onCreateSubtask(trimmedName)
  }

  function commitRename(subtaskId: string) {
    const trimmedName = editingName.trim()
    const existing = subtasks.find((subtask) => subtask.id === subtaskId)
    setEditingSubtaskId(null)

    if (!trimmedName || !existing || trimmedName === existing.name) {
      return
    }

    void onRenameSubtask(subtaskId, trimmedName)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">المهام الفرعية</p>
        {subtasks.length > 0 ? (
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              allCompleted ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            {completedCount}/{subtasks.length} فرعية
          </span>
        ) : isLoading ? (
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            جار التحميل...
          </span>
        ) : null}
      </div>

      {showSkeletons ? (
        <ul className="mt-3 space-y-2" aria-hidden="true">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <SubtaskSkeletonRow key={`subtask-skeleton-${index}`} />
          ))}
        </ul>
      ) : null}

      {!isLoading && subtasks.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">لا توجد مهام فرعية بعد.</p>
      ) : null}

      {subtasks.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {subtasks.map((subtask) => {
            const isCompleted = subtask.status === 'completed'
            const isEditing = editingSubtaskId === subtask.id
            const isPending = subtask.id.startsWith('optimistic-')

            return (
              <li
                key={subtask.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/70'
                } ${isPending ? 'opacity-80' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isCompleted}
                  disabled={!canEdit}
                  onChange={(event) => {
                    void onToggleSubtask(subtask.id, event.target.checked)
                  }}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
                  aria-label={`تبديل حالة ${subtask.name}`}
                />

                {isEditing && canEdit ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => {
                      commitRename(subtask.id)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitRename(subtask.id)
                      }
                      if (event.key === 'Escape') {
                        setEditingSubtaskId(null)
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      if (!canEdit) {
                        return
                      }
                      setEditingSubtaskId(subtask.id)
                      setEditingName(subtask.name)
                    }}
                    className={`min-w-0 flex-1 text-right text-sm transition ${
                      isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                    } ${canEdit ? 'hover:text-cyan-700' : ''} disabled:cursor-default`}
                  >
                    {subtask.name}
                  </button>
                )}

                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('هل تريد حذف هذه المهمة الفرعية؟')) {
                        void onDeleteSubtask(subtask.id)
                      }
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`حذف ${subtask.name}`}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      {allCompleted ? (
        <p className="mt-3 text-xs font-medium text-emerald-700">جميع المهام الفرعية مكتملة.</p>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleAddSubtask} className="mt-3 flex gap-2">
          <input
            value={newSubtaskName}
            onChange={(event) => setNewSubtaskName(event.target.value)}
            placeholder="مهمة فرعية جديدة..."
            disabled={isLoading}
            maxLength={160}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !newSubtaskName.trim()}
            className="shrink-0 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            إضافة
          </button>
        </form>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
