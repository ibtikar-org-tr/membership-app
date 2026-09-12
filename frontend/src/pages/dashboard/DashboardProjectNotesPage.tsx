import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { FiArrowRight, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  createProjectNote,
  deleteProjectNote,
  fetchProjectById,
  fetchProjectMembers,
  fetchProjectNoteById,
  fetchProjectNotes,
  updateProjectNote,
} from '../../api/vms'
import { CollaborativeNoteEditor } from '../../components/dashboard/project-notes/CollaborativeNoteEditor'
import { CollaborativeMarkdownEditor } from '../../components/dashboard/project-notes/CollaborativeMarkdownEditor'
import { buildMentionableMembers } from '../../components/dashboard/project-notes/mentionable-members'
import { resolveOnlineNoteUsers } from '../../components/dashboard/project-notes/NoteOnlineUsers'
import { NoteListPresence } from '../../components/dashboard/project-notes/NoteListPresence'
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
  const [newNoteContentType, setNewNoteContentType] = useState<'html' | 'markdown'>('html')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)

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

  useEffect(() => {
    setIsEditingTitle(false)
    setEditingTitle(selectedNote?.title ?? '')
  }, [selectedNote?.id, selectedNote?.title])

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

  const canCollaborateOnNotes = Boolean(
    user?.membershipNumber &&
      (project?.owner === user.membershipNumber ||
        (currentMembership != null && currentMembership.role !== 'observer')),
  )

  const canEditSelectedNote = selectedNote?.canEdit ?? canCollaborateOnNotes

  const currentUserDisplayName = useMemo(() => {
    if (!user?.membershipNumber) {
      return null
    }

    const member = projectMembers.find((item) => item.membershipNumber === user.membershipNumber)
    return member?.displayName?.trim() || user.membershipNumber
  }, [projectMembers, user?.membershipNumber])

  const memberDisplayNameByNumber = useMemo(
    () => new Map(projectMembers.map((member) => [member.membershipNumber, member.displayName])),
    [projectMembers],
  )

  const mentionableMembers = useMemo(
    () => buildMentionableMembers(project, projectMembers),
    [project, projectMembers],
  )

  const resolveMemberDisplayName = useMemo(
    () => (membershipNumber: string) => memberDisplayNameByNumber.get(membershipNumber) ?? null,
    [memberDisplayNameByNumber],
  )

  const {
    yDoc,
    awareness,
    connectionState,
    isSynced,
    collaborators,
    presenceViewers,
    memberColor,
    displayName: collaboratorDisplayName,
  } = useProjectNoteCollaboration({
    projectId: projectID ?? null,
    noteId: selectedNote?.id ?? null,
    contentType: selectedNote?.contentType ?? null,
    membershipNumber: user?.membershipNumber ?? null,
    displayName: currentUserDisplayName,
    resolveMemberDisplayName,
    enabled: Boolean(projectID && canCollaborateOnNotes && !isLoading),
  })

  const onlineNoteUsers = useMemo(
    () => resolveOnlineNoteUsers(collaborators, memberDisplayNameByNumber),
    [collaborators, memberDisplayNameByNumber],
  )

  const presenceByNoteId = useMemo(() => {
    const map = new Map<string, typeof presenceViewers>()
    for (const viewer of presenceViewers) {
      if (!viewer.noteId) {
        continue
      }
      const list = map.get(viewer.noteId) ?? []
      list.push(viewer)
      map.set(viewer.noteId, list)
    }
    return map
  }, [presenceViewers])

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
      const payload = await createProjectNote({
        projectId: projectID,
        title,
        contentType: newNoteContentType,
      })
      setNotes((current) => [payload.note, ...current])
      setNewNoteTitle('')
      setNewNoteContentType('html')
      setIsCreateOpen(false)
      navigate(`/projects/${projectID}/notes?note=${encodeURIComponent(payload.note.id)}`)
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء الملاحظة.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveTitle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError(null)

    if (!selectedNote) {
      return
    }

    const title = editingTitle.trim()
    if (!title) {
      setActionError('يرجى إدخال عنوان للملاحظة.')
      return
    }

    if (title === selectedNote.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)

    try {
      const payload = await updateProjectNote(selectedNote.id, { title })
      setSelectedNote((current) => (current ? { ...current, ...payload.note } : current))
      setNotes((current) =>
        current.map((note) => (note.id === selectedNote.id ? { ...note, ...payload.note } : note)),
      )
      setIsEditingTitle(false)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'تعذر تحديث عنوان الملاحظة.')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote || !projectID) {
      return
    }

    if (
      !window.confirm(
        `هل أنت متأكد من حذف الملاحظة "${selectedNote.title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      )
    ) {
      return
    }

    setActionError(null)
    setIsDeleting(true)

    try {
      await deleteProjectNote(selectedNote.id)
      setNotes((current) => current.filter((note) => note.id !== selectedNote.id))
      navigate(`/projects/${projectID}/notes`)
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
      <section className="rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] p-5 sm:p-6">
        <p className="text-[15px] text-[#615d59]">جار تحميل ملاحظات المشروع...</p>
      </section>
    )
  }

  if (notFound || hasError || !project || !projectID) {
    return (
      <section className="rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] p-5 sm:p-6">
        <p className="text-[15px] text-red-600">تعذر تحميل ملاحظات المشروع.</p>
        <Link to="/projects" className="mt-3 inline-flex text-[15px] font-medium text-[#0075de]">
          العودة للمشاريع
        </Link>
      </section>
    )
  }

  return (
    <section className="flex h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] p-4 sm:p-5 lg:h-[calc(100dvh-3rem)]">
      <div className="flex shrink-0 items-start gap-2 sm:gap-3">
        <Link
          to={`/projects/${project.id}`}
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/5 text-[#31302e] transition hover:bg-black/10"
          title="العودة للمشروع"
          aria-label="العودة للمشروع"
        >
          <FiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[22px] font-bold tracking-[-0.25px] text-black sm:text-[26px] sm:tracking-[-0.625px]">
              ملاحظات المشروع
            </h2>
            <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold tracking-[0.125px] text-[#0075de]">
              {notes.length}
            </span>
          </div>
          <p className="mt-1 truncate text-[14px] text-[#615d59]">{project.name}</p>
        </div>
      </div>

      {canManageNotes && isCreateOpen ? (
        <form onSubmit={handleCreateNote} className="mt-4 shrink-0 rounded-xl border border-[#e6e6e6] bg-white p-3 sm:p-4">
          <label className="block text-[14px] font-medium text-[#31302e]" htmlFor="new-note-title">
            عنوان الملاحظة
          </label>
          <input
            id="new-note-title"
            value={newNoteTitle}
            onChange={(event) => setNewNoteTitle(event.target.value)}
            className="mt-2 w-full rounded border border-[#ddd] bg-white px-2.5 py-2 text-[15px] text-black outline-none transition focus:shadow-[rgba(0,0,0,0.04)_0_4px_18px] focus:ring-1 focus:ring-[#0075de]"
            placeholder="مثال: محضر الاجتماع - أفكار التخطيط..."
            autoFocus
          />

          <p className="mt-3 text-[14px] font-medium text-[#31302e]">نوع المحتوى</p>
          <div
            className="mt-2 inline-flex rounded-lg border border-[#e6e6e6] bg-[#f6f5f4] p-0.5"
            role="group"
            aria-label="نوع محتوى الملاحظة"
          >
            <button
              type="button"
              onClick={() => setNewNoteContentType('html')}
              className={`inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-[12px] font-medium transition ${
                newNoteContentType === 'html'
                  ? 'bg-white text-black shadow-[rgba(0,0,0,0.04)_0_4px_18px]'
                  : 'text-[#615d59] hover:text-[#31302e]'
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setNewNoteContentType('markdown')}
              className={`inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-[12px] font-medium transition ${
                newNoteContentType === 'markdown'
                  ? 'bg-white text-black shadow-[rgba(0,0,0,0.04)_0_4px_18px]'
                  : 'text-[#615d59] hover:text-[#31302e]'
              }`}
            >
              Markdown
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-[#a39e98]">
            {newNoteContentType === 'markdown'
              ? 'محرر Markdown تعاوني مع تمييز الصيغة.'
              : 'محرر منسّق (HTML) مع شريط أدوات وتنسيق غني.'}
          </p>

          {createError ? <p className="mt-2 text-[14px] text-red-600">{createError}</p> : null}

          <button
            type="submit"
            disabled={isCreating}
            className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#0075de] px-4 py-2 text-[15px] font-medium text-white transition hover:bg-[#005bab] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? 'جار الإنشاء...' : 'إنشاء'}
          </button>
        </form>
      ) : null}

      <div className="mt-4 grid min-h-0 flex-1 gap-3 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-4">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#e6e6e6] bg-white max-lg:max-h-40">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e6e6e6] px-2 py-1.5">
            <p className="px-1 text-[12px] font-semibold tracking-[0.125px] text-[#615d59]">الملاحظات</p>
            {canManageNotes ? (
              <button
                type="button"
                onClick={() => setIsCreateOpen((previous) => !previous)}
                className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition ${
                  isCreateOpen
                    ? 'bg-black/5 text-[#31302e] hover:bg-black/10'
                    : 'bg-[#0075de] text-white hover:bg-[#005bab]'
                }`}
                title={isCreateOpen ? 'إلغاء' : 'ملاحظة جديدة'}
                aria-label={isCreateOpen ? 'إلغاء' : 'ملاحظة جديدة'}
              >
                {isCreateOpen ? <FiX className="h-3.5 w-3.5" aria-hidden /> : <FiPlus className="h-3.5 w-3.5" aria-hidden />}
              </button>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-auto p-2 pt-1.5">
            {notes.length === 0 ? (
              <p className="px-2 py-3 text-[14px] text-[#a39e98]">لا توجد ملاحظات بعد.</p>
            ) : (
              notes.map((note) => {
                const isActive = note.id === selectedNoteId
                const noteViewers = presenceByNoteId.get(note.id) ?? []
                return (
                  <Link
                    key={note.id}
                    to={`/projects/${projectID}/notes?note=${encodeURIComponent(note.id)}`}
                    className={`block rounded-[5px] px-2.5 py-2 transition ${
                      isActive
                        ? 'bg-[#f6f5f4] text-black ring-1 ring-[#0075de]'
                        : 'text-[#31302e] hover:bg-[#f6f5f4]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{note.title}</p>
                      <NoteListPresence viewers={noteViewers} />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-[#615d59]">
                      {sanitizeNotePreview(note.contentPreview) || 'ملاحظة فارغة'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-[#f6f5f4] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0075de]">
                        {note.contentType === 'markdown' ? 'MD' : 'HTML'}
                      </span>
                      <p className="text-[11px] text-[#a39e98]">{formatDateEnCA(note.updatedAt)}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          {selectedNote ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="min-w-0 shrink-0">
                {canManageNotes && isEditingTitle ? (
                  <form onSubmit={handleSaveTitle} className="flex flex-wrap items-center gap-2">
                    <input
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      maxLength={160}
                      autoFocus
                      disabled={isSavingTitle}
                      className="min-w-0 flex-1 rounded border border-[#ddd] bg-white px-2.5 py-2 text-[20px] font-semibold tracking-[-0.125px] text-black outline-none focus:ring-1 focus:ring-[#0075de] disabled:opacity-60"
                      aria-label="عنوان الملاحظة"
                    />
                    <button
                      type="submit"
                      disabled={isSavingTitle}
                      className="inline-flex cursor-pointer rounded-full bg-[#0075de] px-3 py-2 text-[14px] font-medium text-white transition hover:bg-[#005bab] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingTitle ? 'جار الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      type="button"
                      disabled={isSavingTitle}
                      onClick={() => {
                        setEditingTitle(selectedNote.title)
                        setIsEditingTitle(false)
                        setActionError(null)
                      }}
                      className="inline-flex cursor-pointer rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-[14px] font-medium text-[#31302e] transition hover:bg-[#f6f5f4] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      إلغاء
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-[-0.125px] text-black">
                      {selectedNote.title}
                    </h3>
                    {canManageNotes ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTitle(selectedNote.title)
                            setIsEditingTitle(true)
                            setActionError(null)
                          }}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e6e6e6] bg-white text-[#615d59] transition hover:bg-[#f6f5f4] hover:text-[#31302e]"
                          title="تعديل العنوان"
                          aria-label="تعديل العنوان"
                        >
                          <FiEdit2 className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteNote()}
                          disabled={isDeleting}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#e6e6e6] bg-white text-[#dd5b00] transition hover:bg-[#f6f5f4] disabled:cursor-not-allowed disabled:opacity-60"
                          title="حذف الملاحظة"
                          aria-label="حذف الملاحظة"
                        >
                          <FiTrash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
                <p className="mt-1 text-[12px] text-[#a39e98]">
                  أنشأها {selectedNote.createdByDisplayName ?? selectedNote.createdBy} • آخر تحديث{' '}
                  {formatDateEnCA(selectedNote.updatedAt)}
                </p>
              </div>

              {actionError ? <p className="shrink-0 text-[14px] text-red-600">{actionError}</p> : null}

              {!canEditSelectedNote ? (
                <div className="shrink-0 rounded-xl border border-[#e6e6e6] bg-white px-3 py-2 text-[14px] text-[#31302e]">
                  دورك في المشروع يسمح بمشاهدة الملاحظات فقط.
                </div>
              ) : null}

              {selectedNote.contentType === 'markdown' ? (
                <CollaborativeMarkdownEditor
                  noteId={selectedNote.id}
                  yDoc={canEditSelectedNote ? yDoc : null}
                  awareness={canEditSelectedNote ? awareness : null}
                  initialContent={selectedNote.content}
                  readOnly={!canEditSelectedNote}
                  connectionState={canEditSelectedNote ? connectionState : 'idle'}
                  isSynced={canEditSelectedNote ? isSynced : true}
                  onlineUsers={onlineNoteUsers}
                  displayName={collaboratorDisplayName}
                  membershipNumber={user?.membershipNumber ?? ''}
                />
              ) : (
                <CollaborativeNoteEditor
                  noteId={selectedNote.id}
                  yDoc={canEditSelectedNote ? yDoc : null}
                  awareness={canEditSelectedNote ? awareness : null}
                  initialContent={selectedNote.content}
                  readOnly={!canEditSelectedNote}
                  connectionState={canEditSelectedNote ? connectionState : 'idle'}
                  isSynced={canEditSelectedNote ? isSynced : true}
                  onlineUsers={onlineNoteUsers}
                  memberColor={memberColor}
                  displayName={collaboratorDisplayName}
                  membershipNumber={user?.membershipNumber ?? ''}
                  mentionableMembers={mentionableMembers}
                />
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-[#e6e6e6] bg-white px-6 text-center">
              <div>
                <p className="text-[15px] font-medium text-[#31302e]">اختر ملاحظة من القائمة للبدء.</p>
                <p className="mt-2 text-[14px] text-[#a39e98]">يمكن لأعضاء الفريق الكتابة معاً في الوقت نفسه.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
