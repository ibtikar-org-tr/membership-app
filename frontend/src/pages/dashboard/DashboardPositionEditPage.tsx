import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import {
  deleteProjectPosition,
  fetchPositionById,
  fetchProjectMembers,
  reviewPositionApplication,
  updateProjectPosition,
} from '../../api/vms'
import type { VmsPosition, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'

function applicationStatusLabel(status: string) {
  if (status === 'pending') return 'قيد المراجعة'
  if (status === 'accepted') return 'مقبولة'
  if (status === 'rejected') return 'مرفوضة'
  return status
}

export function DashboardPositionEditPage() {
  const { positionID } = useParams()
  const user = useMemo(() => getStoredUser(), [])

  const [position, setPosition] = useState<VmsPosition | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null)

  useEffect(() => {
    if (!positionID || !user) {
      return
    }

    const currentPositionId = positionID
    const currentUser = user
    const controller = new AbortController()

    async function loadPositionData() {
      try {
        const positionPayload = await fetchPositionById(currentPositionId, currentUser.membershipNumber)

        if (controller.signal.aborted) {
          return
        }

        setPosition(positionPayload.position)

        // Load project members for that project
        if (positionPayload.position.projectId) {
          const membersPayload = await fetchProjectMembers(positionPayload.position.projectId)
          setProjectMembers(membersPayload.projectMembers)
        }
      } catch {
        if (!controller.signal.aborted) {
          setNotFound(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadPositionData()

    return () => {
      controller.abort()
    }
  }, [positionID, user])

  const canManagePosition = useMemo(() => {
    if (!position || !user) {
      return false
    }

    const managerMembershipNumbers = new Set(
      projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber),
    )

    return position.createdBy === user.membershipNumber || managerMembershipNumbers.has(user.membershipNumber)
  }, [position, projectMembers, user])

  const handleSavePosition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)

    if (!positionID || !position || !user || !canManagePosition) {
      setSaveError('غير مصرح لتحديث هذه الفرصة.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const seatsRaw = Number(formData.get('seats') ?? position.seats)
    const statusRaw = String(formData.get('status') ?? position.status).trim()

    if (!name) {
      setSaveError('يرجى إدخال اسم الفرصة التطوعية.')
      return
    }

    if (Number.isNaN(seatsRaw) || seatsRaw < 1) {
      setSaveError('عدد المقاعد يجب أن يكون 1 على الأقل.')
      return
    }

    setIsSaving(true)

    try {
      const payload = await updateProjectPosition(
        positionID,
        {
          name,
          description: description || undefined,
          seats: Math.max(1, Math.trunc(seatsRaw)),
          status: (statusRaw === 'open' || statusRaw === 'filled' || statusRaw === 'closed' ? statusRaw : position.status) as 'open' | 'filled' | 'closed',
        },
        user.membershipNumber,
      )

      setPosition(payload.position)
      setSaveSuccess('تم حفظ التعديلات بنجاح.')
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message)
      } else {
        setSaveError('تعذر تحديث الفرصة التطوعية.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePosition = async () => {
    if (
      !positionID ||
      !position ||
      !user ||
      !canManagePosition ||
      !confirm('هل أنت متأكد من حذف هذه الفرصة التطوعية؟ هذا الإجراء لا يمكن التراجع عنه.')
    ) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteProjectPosition(positionID, user.membershipNumber)
      // Navigate back to project positions
      window.location.href = `/dashboard/projects/${position.projectId}/positions`
    } catch (requestError) {
      if (requestError instanceof Error) {
        setDeleteError(requestError.message)
      } else {
        setDeleteError('تعذر حذف الفرصة التطوعية.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReviewApplication = async (applicationId: string, status: 'accepted' | 'rejected') => {
    if (!user || !canManagePosition) {
      setReviewError('لا تملك صلاحية مراجعة الطلبات.')
      return
    }

    setReviewError(null)
    setReviewingApplicationId(applicationId)

    try {
      await reviewPositionApplication(applicationId, { status }, user.membershipNumber)
      // Reload position to get updated applications
      if (positionID) {
        const positionPayload = await fetchPositionById(positionID, user.membershipNumber)
        setPosition(positionPayload.position)
      }
    } catch (requestError) {
      if (requestError instanceof Error) {
        setReviewError(requestError.message)
      } else {
        setReviewError('تعذر مراجعة الطلب.')
      }
    } finally {
      setReviewingApplicationId(null)
    }
  }

  if (!positionID || notFound) {
    return <Navigate to="/dashboard/projects" replace />
  }

  if (isLoading || !position) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل الفرصة التطوعية...</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{position.name}</h2>
          <Link
            to={`/dashboard/projects/${position.projectId}/positions`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة للقائمة
          </Link>
        </div>

        <form onSubmit={handleSavePosition} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">اسم الفرصة التطوعية</label>
            <input
              name="name"
              type="text"
              defaultValue={position.name}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              required
              disabled={!canManagePosition}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">الوصف</label>
            <textarea
              name="description"
              defaultValue={position.description ?? ''}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
              disabled={!canManagePosition}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">عدد المقاعد</label>
              <input
                name="seats"
                type="number"
                min={1}
                defaultValue={position.seats}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                disabled={!canManagePosition}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">الحالة</label>
              <select
                name="status"
                defaultValue={position.status}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-600 focus:bg-white"
                disabled={!canManagePosition}
              >
                <option value="open">مفتوحة</option>
                <option value="filled">مكتملة</option>
                <option value="closed">مغلقة</option>
              </select>
            </div>
          </div>

          {canManagePosition ? (
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving ? 'جار الحفظ...' : 'حفظ التعديلات'}
              </button>

              <button
                type="button"
                onClick={handleDeletePosition}
                disabled={isDeleting}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-100 disabled:text-red-400"
              >
                {isDeleting ? 'جار الحذف...' : 'حذف الفرصة'}
              </button>
            </div>
          ) : null}

          {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
          {saveSuccess ? <p className="text-sm text-emerald-600">{saveSuccess}</p> : null}
        </form>
      </div>

      {canManagePosition ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-900">طلبات التطوع</h3>

          {reviewError ? <p className="mb-3 text-sm text-red-600">{reviewError}</p> : null}

          {position.applications.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد طلبات حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {position.applications.map((application) => (
                <div key={application.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{application.displayName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {application.membershipNumber} • {applicationStatusLabel(application.status)}
                      </p>
                      {application.motivationLetter ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{application.motivationLetter}</p>
                      ) : null}
                    </div>

                    {application.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewApplication(application.id, 'accepted')}
                          disabled={reviewingApplicationId === application.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {reviewingApplicationId === application.id ? 'جاري...' : 'قبول'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewApplication(application.id, 'rejected')}
                          disabled={reviewingApplicationId === application.id}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {reviewingApplicationId === application.id ? 'جاري...' : 'رفض'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
