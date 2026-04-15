import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import { ArrowRight, ImageIcon, Link2, Plus, Save, X } from 'lucide-react'
import { fetchEventById, fetchProjectMembers, updateEvent, uploadEventBanner } from '../../api/vms'
import type { VmsEvent, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { ImageUploader } from '../../components/ImageUploader'

function statusLabel(status: string) {
  if (status === 'draft') return 'مسودة'
  if (status === 'public') return 'منشورة'
  if (status === 'archived') return 'مؤرشفة'
  return status
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function DashboardEventEditPage() {
  const { eventID } = useParams()
  const navigate = useNavigate()
  const user = useMemo(() => getStoredUser(), [])

  const [eventItem, setEventItem] = useState<VmsEvent | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [locationType, setLocationType] = useState<'online' | 'physical'>('physical')
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [associatedUrls, setAssociatedUrls] = useState<{ label: string; url: string }[]>([])
  const [newUrlLabel, setNewUrlLabel] = useState('')
  const [newUrlValue, setNewUrlValue] = useState('')

  useEffect(() => {
    if (!eventID) return
    const currentEventId = eventID
    const controller = new AbortController()

    async function loadEvent() {
      try {
        const eventPayload = await fetchEventById(currentEventId)
        if (controller.signal.aborted) return
        setEventItem(eventPayload.event)
      } catch {
        if (!controller.signal.aborted) setNotFound(true)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadEvent()
    return () => controller.abort()
  }, [eventID])

  useEffect(() => {
    if (!eventItem || !eventItem.projectId) {
      setProjectMembers([])
      return
    }
    const projectId = eventItem.projectId

    const controller = new AbortController()

    async function loadProjectMembers() {
      try {
        const payload = await fetchProjectMembers(projectId)
        if (!controller.signal.aborted) setProjectMembers(payload.projectMembers)
      } catch {
        if (!controller.signal.aborted) setProjectMembers([])
      }
    }

    void loadProjectMembers()
    return () => controller.abort()
  }, [eventItem])

  useEffect(() => {
    if (!eventItem) {
      return
    }

    setLocationType(eventItem.address === 'online' ? 'online' : 'physical')
    setAssociatedUrls(
      Object.entries(eventItem.associatedUrls ?? {}).map(([label, url]) => ({
        label,
        url: String(url),
      })),
    )
  }, [eventItem])

  const canEditEvent = useMemo(() => {
    if (!user || !eventItem) {
      return false
    }

    if (eventItem.projectId && eventItem.projectOwner) {
      const managers = new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber))
      return eventItem.projectOwner === user.membershipNumber || managers.has(user.membershipNumber)
    }

    return eventItem.createdBy === user.membershipNumber
  }, [eventItem, projectMembers, user])

  const handleAddUrl = () => {
    if (!newUrlLabel.trim() || !newUrlValue.trim()) return
    setAssociatedUrls((previous) => [...previous, { label: newUrlLabel.trim(), url: newUrlValue.trim() }])
    setNewUrlLabel('')
    setNewUrlValue('')
  }

  const handleRemoveUrl = (index: number) => {
    setAssociatedUrls((previous) => previous.filter((_, i) => i !== index))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddUrl()
    }
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)

    if (!eventID || !eventItem) return

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const startTime = String(formData.get('startTime') ?? '').trim()
    const endTime = String(formData.get('endTime') ?? '').trim()
    const statusRaw = String(formData.get('status') ?? eventItem.status).trim()
    const status = statusRaw === 'public' || statusRaw === 'archived' ? statusRaw : 'draft'
    const country = String(formData.get('country') ?? '').trim()
    const region = String(formData.get('region') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const address = String(formData.get('address') ?? '').trim()

    if (!name) {
      setSaveError('يرجى إدخال اسم الفعالية.')
      return
    }

    const validUrls = associatedUrls.filter((item) => item.label.trim() && item.url.trim())
    const associatedUrlsObject = validUrls.length > 0 ? Object.fromEntries(validUrls.map((item) => [item.label.trim(), item.url.trim()])) : undefined

    setIsSaving(true)
    try {
      const payload = await updateEvent(eventID, {
        name,
        ...(description ? { description } : {}),
        ...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
        ...(endTime ? { endTime: new Date(endTime).toISOString() } : {}),
        status,
        ...(associatedUrlsObject ? { associatedUrls: associatedUrlsObject } : {}),
        ...(locationType === 'online'
          ? { address: 'online' }
          : { country: country || undefined, region: region || undefined, city: city || undefined, address: address || undefined }),
      })

      let updated = payload.event
      if (selectedBannerFile) {
        const bannerPayload = await uploadEventBanner(eventID, selectedBannerFile)
        updated = bannerPayload.event
      }

      setEventItem(updated)
      setSelectedBannerFile(null)
      setUploadError(null)
      setSaveSuccess('تم حفظ التعديلات بنجاح.')
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message)
      } else {
        setSaveError('تعذر تحديث الفعالية.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!eventID || notFound) {
    return <Navigate to="/dashboard/events" replace />
  }

  if (isLoading || !eventItem) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">جار تحميل صفحة تعديل الفعالية...</p>
      </section>
    )
  }

  if (!canEditEvent) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-medium text-amber-900">لا تملك صلاحية تعديل هذه الفعالية.</p>
        <Link to={`/dashboard/event/${eventID}`} className="mt-3 inline-flex text-sm font-semibold text-amber-800 underline">
          العودة إلى صفحة الفعالية
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">تحرير الفعالية</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{eventItem.name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              الحالة الحالية: <span className="font-semibold">{statusLabel(eventItem.status)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/event/${eventItem.id}`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              عرض الفعالية
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <article className="rounded-2xl border border-cyan-200/60 bg-linear-to-br from-white to-cyan-50/30 p-5 shadow-sm ring-1 ring-cyan-900/5 sm:p-6">
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-4">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-slate-700">اسم الفعالية</span>
            <input
              name="name"
              defaultValue={eventItem.name}
              placeholder="اسم الفعالية"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">وقت البداية</span>
            <input
              name="startTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(eventItem.startTime)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">وقت النهاية</span>
            <input
              name="endTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(eventItem.endTime)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">حالة الفعالية</span>
            <select
              name="status"
              defaultValue={eventItem.status}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="draft">مسودة</option>
              <option value="public">منشورة</option>
              <option value="archived">مؤرشفة</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">نوع الفعالية</span>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as 'online' | 'physical')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="physical">فعالية حضورية</option>
              <option value="online">فعالية أون لاين</option>
            </select>
          </label>
          <label className="md:col-span-4 space-y-1">
            <span className="text-xs font-medium text-slate-700">وصف الفعالية</span>
            <textarea
              name="description"
              defaultValue={eventItem.description ?? ''}
              placeholder="وصف الفعالية"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              rows={3}
            />
          </label>

          {locationType === 'physical' ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-700">الدولة</span>
                <input name="country" defaultValue={eventItem.country ?? ''} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-700">المنطقة</span>
                <input name="region" defaultValue={eventItem.region ?? ''} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-700">المدينة</span>
                <input name="city" defaultValue={eventItem.city ?? ''} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-700">العنوان التفصيلي</span>
                <input name="address" defaultValue={eventItem.address ?? ''} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20" />
              </label>
            </>
          ) : (
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">العنوان</span>
              <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-800">online</div>
              <input name="address" type="hidden" value="online" />
            </label>
          )}

          <div className="md:col-span-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ImageIcon className="h-4 w-4 text-slate-500" />
              صورة البانر
            </h3>
            {eventItem.imageUrl ? (
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="mb-2 text-xs font-medium text-slate-600">الصورة الحالية</p>
                <img src={eventItem.imageUrl} alt="" className="h-36 w-full max-w-md rounded-lg border border-slate-200 object-cover shadow-inner" />
              </div>
            ) : null}
            <ImageUploader
              onSelect={(file) => {
                setSelectedBannerFile(file)
                setUploadError(null)
              }}
              onError={(error) => setUploadError(error)}
            />
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Link2 className="h-4 w-4 text-slate-500" />
              الروابط المرتبطة
            </h3>
            {associatedUrls.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {associatedUrls.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs">
                    <span>{item.label}</span>
                    <button type="button" onClick={() => handleRemoveUrl(index)} className="text-red-600 hover:text-red-700">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newUrlLabel}
                onChange={(e) => setNewUrlLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="العنوان"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <input
                type="url"
                value={newUrlValue}
                onChange={(e) => setNewUrlValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="الرابط"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={!newUrlLabel.trim() || !newUrlValue.trim()}
                className="rounded-lg border border-cyan-200 bg-cyan-50 p-2 text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'جار الحفظ...' : 'حفظ التعديلات'}
            </button>
            <Link
              to={`/dashboard/event/${eventItem.id}`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              العودة لصفحة الفعالية
            </Link>
          </div>
        </form>
        {saveError ? <p className="mt-3 text-sm text-red-600">{saveError}</p> : null}
        {uploadError ? <p className="mt-3 text-sm text-red-600">{uploadError}</p> : null}
        {saveSuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{saveSuccess}</p> : null}
      </article>
    </section>
  )
}
