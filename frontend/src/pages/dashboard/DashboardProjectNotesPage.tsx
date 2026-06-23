import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createProjectNote,
  deleteProjectNote,
  fetchProjectById,
  fetchProjectMembers,
  fetchProjectNoteById,
  fetchProjectNotes,
} from '../../api/vms'
import { CollaborativeNoteEditor } from '../../components/dashboard/project-notes/CollaborativeNoteEditor'
import { useProjectNoteCollaboration } from '../../hooks/useProjectNoteCollaboration'
import type { VmsProject, VmsProjectMember, VmsProjectNote } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { formatDateEnCA } from '../../utils/date-format'
import { sanitizeNotePreview } from '../../utils/yjs-rich-text'

export function DashboardProjectNotesPage() {
  const { projectID } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useMemo(() => getStoredUser(), [])

  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [notes, setNotes] = useState<VmsProjectNote[]>([])
  const [selectedNote, setSelectedNote] = useState<VmsProjectNote | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedNoteId = searchParams.get('note')

  useEffect(() => {
    if (!projectID) {
      return
    }

    const currentProjectId = projectID
    const controller = new AbortController()

    async function loadPageData() {
      try {
        const [projectPayload, membersPayload, notesPayload] = await Promise.all([
          fetchProjectById(currentProjectId, user?.membershipNumber),
          fetchProjectMembers(currentProjectId),
          fetchProjectNotes(currentProjectId),
        ])

        if (controller.signal.aborted) {
          return
        }

        setProject(projectPayload.project)
        setProjectMembers(membersPayload.projectMembers)
        setNotes(notesPayload.notes)
        setHasError(false)
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setHasError(true)
        setNotFound(true)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadPageData()

    return () => {
      controller.abort()
    }
  }, [projectID, user?.membershipNumber])

  useEffect(() => {
    if (!selectedNoteId) {
      setSelectedNote(null)
      return
    }

    const noteFromList = notes.find((note) => note.id === selectedNoteId)
    if (noteFromList) {
      setSelectedNote(noteFromList)
      return
    }

    let cancelled = false

    async function loadSelectedNote() {
      if (!selectedNoteId) {
        return
      }

      try {
        const payload = await fetchProjectNoteById(selectedNoteId)
        if (!cancelled) {
          setSelectedNote(payload.note)
        }
      } catch {
        if (!cancelled) {
          setSelectedNote(null)
        }
      }
    }

    void loadSelectedNote()

    return () => {
      cancelled = true
    }
  }, [notes, selectedNoteId])

  const managerMembershipNumbers = useMemo(
    () => new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber)),
    [projectMembers],
  )

  const canManageNotes = useMemo(() => {
    if (!project || !user) {
      return false
    }

    return project.owner === user.membershipNumber || managerMembershipNumbers.has(user.membershipNumber)
  }, [managerMembershipNumbers, project, user])

  const currentMembership = useMemo(
    () => projectMembers.find((member) => member.membershipNumber === user?.membershipNumber) ?? null,
    [projectMembers, user?.membershipNumber],
  )

  const canEditSelectedNote = selectedNote?.canEdit ?? currentMembership?.role !== 'observer'

  const { yDoc, awareness, connectionState, collaborators, memberColor, displayName: collaboratorDisplayName } =
    useProjectNoteCollaboration({
      noteId: selectedNote?.id ?? null,
      membershipNumber: user?.membershipNumber ?? null,
      displayName: user?.email ?? user?.membershipNumber ?? null,
      enabled: Boolean(selectedNote && canEditSelectedNote && !isLoading),
    })

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError(null)

    if (!projectID || !user) {
      setCreateError('يجب تسجيل الدخول أولاً.')
      return
    }

    const title = newNoteTitle.trim()
    if (!title) {
      setCreateError('يرجى إدخال عنوان للملاحظة.')
      return
    }

    setIsCreating(true)

    try {
      const payload = await createProjectNote({ projectId: projectID, title })
      setNotes((current) => [payload.note, ...current])
      setNewNoteTitle('')
      setIsCreateOpen(false)
      navigate(`/dashboard/projects/${projectID}/notes?note=${encodeURIComponent(payload.note.id)}`)
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء الملاحظة.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote || !projectID) {
      return
    }

    setActionError(null)
    setIsDeleting(true)

    try {
      await deleteProjectNote(selectedNote.id)
      setNotes((current) => current.filter((note) => note.id !== selectedNote.id))
      navigate(`/dashboard/projects/${projectID}/notes`)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'تعذر حذف الملاحظة.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل ملاحظات المشروع...</p>
      </section>
    )
  }

  if (notFound || hasError || !project || !projectID) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-red-600">تعذر تحميل ملاحظات المشروع.</p>
        <Link to="/dashboard/projects" className="mt-3 inline-flex text-sm font-medium text-slate-700 underline">
          العودة للمشاريع
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">ملاحظات المشروع</h2>
          <p className="mt-1 text-sm text-slate-500">{project.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {notes.length} ملاحظة
          </span>
          {canManageNotes ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen((previous) => !previous)}
              className="inline-flex items-center rounded-md border border-slate-300 bg-slate-950 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              {isCreateOpen ? 'إغلاق إضافة ملاحظة' : 'إضافة ملاحظة'}
            </button>
          ) : null}
          <Link
            to={`/dashboard/projects/${project.id}`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة للمشروع
          </Link>
        </div>
      </div>

      {canManageNotes && isCreateOpen ? (
        <form onSubmit={handleCreateNote} className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="new-note-title">
            عنوان الملاحظة
          </label>
          <input
            id="new-note-title"
            value={newNoteTitle}
            onChange={(event) => setNewNoteTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-500 focus:ring-2"
            placeholder="مثال: محضر الاجتماع، أفكار التخطيط..."
          />
          {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}
          <button
            type="submit"
            disabled={isCreating}
            className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? 'جار الإنشاء...' : 'إنشاء ملاحظة'}
          </button>
        </form>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">الملاحظات</p>
          <div className="mt-2 space-y-1">
            {notes.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">لا توجد ملاحظات بعد.</p>
            ) : (
              notes.map((note) => {
                const isActive = note.id === selectedNoteId
                return (
                  <Link
                    key={note.id}
                    to={`/dashboard/projects/${projectID}/notes?note=${encodeURIComponent(note.id)}`}
                    className={`block rounded-xl px-3 py-2 transition ${
                      isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/80'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-slate-900">{note.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {sanitizeNotePreview(note.contentPreview) || 'ملاحظة فارغة'}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">{formatDateEnCA(note.updatedAt)}</p>
                  </Link>
                )
              })
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {selectedNote ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedNote.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    أنشأها {selectedNote.createdByDisplayName ?? selectedNote.createdBy} • آخر تحديث{' '}
                    {formatDateEnCA(selectedNote.updatedAt)}
                  </p>
                </div>
                {canManageNotes ? (
                  <button
                    type="button"
                    onClick={() => void handleDeleteNote()}
                    disabled={isDeleting}
                    className="inline-flex rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? 'جار الحذف...' : 'حذف الملاحظة'}
                  </button>
                ) : null}
              </div>

              {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

              <CollaborativeNoteEditor
                noteId={selectedNote.id}
                yDoc={canEditSelectedNote ? yDoc : null}
                awareness={canEditSelectedNote ? awareness : null}
                initialContent={selectedNote.content}
                readOnly={!canEditSelectedNote}
                connectionState={canEditSelectedNote ? connectionState : 'idle'}
                collaborators={canEditSelectedNote ? collaborators : []}
                memberColor={memberColor}
                displayName={collaboratorDisplayName}
              />

              {!canEditSelectedNote ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  دورك في المشروع يسمح بمشاهدة الملاحظات فقط.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div>
                <p className="text-sm font-medium text-slate-700">اختر ملاحظة من القائمة لبدء التحرير المشترك.</p>
                <p className="mt-2 text-xs text-slate-500">
                  يمكن لأعضاء الفريق الكتابة معاً في الوقت نفسه.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
