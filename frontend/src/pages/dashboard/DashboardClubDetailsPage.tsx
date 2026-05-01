import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { FormEvent } from 'react'
import {
  createClubMember,
  deleteClub,
  deleteClubMember,
  fetchClubById,
  fetchClubMembers,
  fetchProjectById,
  fetchProjectMembers,
  updateClub,
  updateClubMember,
  uploadClubBanner,
} from '../../api/vms'
import type { VmsClub, VmsClubMember, VmsProject, VmsProjectMember } from '../../types/vms'
import { getStoredUser } from '../../utils/auth'
import { ImageUploader } from '../../components/ImageUploader'
import { SkillsField } from '../../components/SkillsField'
import { LocationDetailsComponent } from '../../components/registration/sections/personal-info-section/LocationDetailsComponent'
import { initialRegistrationFormData } from '../../types/registration'
import type { RegistrationFormData } from '../../types/registration'

const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: 'نشط',
  pending: 'بانتظار الموافقة',
  rejected: 'مرفوض',
}

export function DashboardClubDetailsPage() {
  const { clubID } = useParams()
  const user = useMemo(() => getStoredUser(), [])

  const [club, setClub] = useState<VmsClub | null>(null)
  const [project, setProject] = useState<VmsProject | null>(null)
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [clubMembers, setClubMembers] = useState<VmsClubMember[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [locationType, setLocationType] = useState<'online' | 'physical'>('physical')
  const [locationData, setLocationData] = useState<RegistrationFormData>(initialRegistrationFormData)
  const [telegramGroupId, setTelegramGroupId] = useState('')
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [clubSkills, setClubSkills] = useState('')

  const [membershipNumberInput, setMembershipNumberInput] = useState('')

  useEffect(() => {
    if (!clubID) {
      return
    }

    const currentClubId = clubID

    let isActive = true

    async function loadClubData() {
      try {
        const clubPayload = await fetchClubById(currentClubId)
        if (!isActive) {
          return
        }

        setClub(clubPayload.club)

        const [projectPayload, projectMembersPayload, clubMembersPayload] = await Promise.all([
          fetchProjectById(clubPayload.club.projectId, user?.membershipNumber),
          fetchProjectMembers(clubPayload.club.projectId),
          fetchClubMembers(clubPayload.club.id),
        ])

        if (!isActive) {
          return
        }

        setProject(projectPayload.project)
        setProjectMembers(projectMembersPayload.projectMembers)
        setClubMembers(clubMembersPayload.clubMembers)
      } catch {
        if (isActive) {
          setNotFound(true)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadClubData()

    return () => {
      isActive = false
    }
  }, [clubID, user?.membershipNumber])

  const managerMembershipNumbers = useMemo(
    () => new Set(projectMembers.filter((member) => member.role === 'manager').map((member) => member.membershipNumber)),
    [projectMembers],
  )

  const canManageClub = useMemo(() => {
    if (!project || !user) {
      return false
    }

    const membershipNumber = user.membershipNumber
    return project.owner === membershipNumber || managerMembershipNumbers.has(membershipNumber)
  }, [managerMembershipNumbers, project, user])

  const pendingMembers = useMemo(
    () => clubMembers.filter((member) => member.status === 'pending'),
    [clubMembers],
  )

  useEffect(() => {
    if (!club) {
      return
    }

    setLocationType(club.address === 'online' ? 'online' : 'physical')
    setLocationData((previous) => ({
      ...previous,
      country: club.country ?? '',
      region: club.region ?? '',
      city: club.city ?? '',
      address: club.address === 'online' ? '' : (club.address ?? ''),
    }))
    setTelegramGroupId(club.telegramGroupId ?? '')
    setClubSkills(Object.keys(club.skills ?? {}).join(', '))
  }, [club])

  const handleUpdateClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError(null)

    if (!club || !user?.membershipNumber) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const visibility = String(formData.get('visibility') ?? 'public').trim()
    const joinPolicy = String(formData.get('joinPolicy') ?? 'auto_approve').trim()
    const country = locationData.country.trim()
    const region = locationData.region.trim()
    const city = locationData.city.trim()
    const address = locationData.address.trim()
    const skillsRaw = String(formData.get('skills') ?? '').trim()
    const skills = skillsRaw
      ? Object.fromEntries(
          skillsRaw
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => [item, 'required']),
        )
      : undefined

    if (!name) {
      setSaveError('يرجى إدخال اسم النادي.')
      return
    }

    const normalizedVisibility = visibility === 'private' || visibility === 'draft' ? visibility : 'public'
    const normalizedJoinPolicy =
      joinPolicy === 'request_to_join' || joinPolicy === 'invite_only' ? joinPolicy : 'auto_approve'

    setIsSaving(true)

    try {
      const payload = await updateClub(
        club.id,
        {
          name,
          description: description || undefined,
          ...(skills ? { skills } : {}),
          ...(locationType === 'online'
            ? { address: 'online' }
            : {
                country: country || undefined,
                region: region || undefined,
                city: city || undefined,
                address: address || undefined,
              }),
          ...(telegramGroupId.trim() ? { telegramGroupId: telegramGroupId.trim() } : {}),
          visibility: normalizedVisibility,
          joinPolicy: normalizedJoinPolicy,
        },
        user.membershipNumber,
      )

      let updatedClub = payload.club

      if (selectedBannerFile) {
        try {
          const bannerPayload = await uploadClubBanner(club.id, selectedBannerFile)
          updatedClub = bannerPayload.club
          setSelectedBannerFile(null)
          setUploadError(null)
        } catch (bannerError) {
          if (bannerError instanceof Error) {
            setUploadError(bannerError.message)
          } else {
            setUploadError('تعذر رفع صورة النادي.')
          }
        }
      }

      setClub(updatedClub)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setSaveError(requestError.message)
      } else {
        setSaveError('تعذر تحديث النادي.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMember = async () => {
    setActionError(null)

    if (!club || !user?.membershipNumber) {
      return
    }

    const membershipNumber = membershipNumberInput.trim()

    if (!membershipNumber) {
      setActionError('يرجى إدخال رقم العضوية.')
      return
    }

    try {
      await createClubMember(
        {
          clubId: club.id,
          membershipNumber,
        },
        user.membershipNumber,
      )

      const payload = await fetchClubMembers(club.id)
      setClubMembers(payload.clubMembers)
      setMembershipNumberInput('')
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر إضافة العضو.')
      }
    }
  }

  const handleApproveOrReject = async (membershipNumber: string, status: 'active' | 'rejected') => {
    setActionError(null)

    if (!club || !user?.membershipNumber) {
      return
    }

    try {
      await updateClubMember(club.id, membershipNumber, { status }, user.membershipNumber)
      const payload = await fetchClubMembers(club.id)
      setClubMembers(payload.clubMembers)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر تحديث طلب العضوية.')
      }
    }
  }

  const handleRemoveMember = async (membershipNumber: string) => {
    setActionError(null)

    if (!club || !user?.membershipNumber) {
      return
    }

    try {
      await deleteClubMember(club.id, membershipNumber, user.membershipNumber)
      const payload = await fetchClubMembers(club.id)
      setClubMembers(payload.clubMembers)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر إزالة العضو.')
      }
    }
  }

  const handleDeleteClub = async () => {
    setActionError(null)

    if (!club || !user?.membershipNumber) {
      return
    }

    try {
      await deleteClub(club.id, user.membershipNumber)
      setNotFound(true)
    } catch (requestError) {
      if (requestError instanceof Error) {
        setActionError(requestError.message)
      } else {
        setActionError('تعذر حذف النادي.')
      }
    }
  }

  if (!clubID || notFound) {
    return <Navigate to="/dashboard/clubs" replace />
  }

  if (isLoading || !club) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm text-slate-500">جار تحميل تفاصيل النادي...</p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{club.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{club.description ?? 'لا يوجد وصف للنادي.'}</p>
        </div>

        <div className="flex items-center gap-2">
          {project ? (
            <Link
              to={`/dashboard/projects/${project.id}/clubs`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              أندية المشروع
            </Link>
          ) : null}
          <Link
            to="/dashboard/clubs"
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            كل الأندية
          </Link>
        </div>
      </div>

      {canManageClub ? (
        <form onSubmit={handleUpdateClub} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
          <div className="md:col-span-2">
            {club.imageUrl ? (
              <div className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <p className="mb-2 text-xs font-medium text-slate-600">الصورة الحالية</p>
                <img src={club.imageUrl} alt="" className="h-36 w-full max-w-md rounded-md border border-slate-200 object-cover" />
              </div>
            ) : null}
            <ImageUploader
              onSelect={(file) => {
                setSelectedBannerFile(file)
                setUploadError(null)
              }}
              onError={(error) => setUploadError(error)}
            />
            {uploadError ? <p className="mt-2 text-sm text-red-600">{uploadError}</p> : null}
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">اسم النادي</span>
            <input
              name="name"
              defaultValue={club.name}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">الوصف</span>
            <input
              name="description"
              defaultValue={club.description ?? ''}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">معرف مجموعة التلغرام</span>
            <input
              name="telegramGroupId"
              value={telegramGroupId}
              onChange={(event) => setTelegramGroupId(event.target.value)}
              placeholder="مثال: -123456789"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
          </label>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-700">نوع موقع النادي</span>
            <select
              value={locationType}
              onChange={(event) => setLocationType(event.target.value === 'online' ? 'online' : 'physical')}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            >
              <option value="physical">نادي حضوري</option>
              <option value="online">نادي أون لاين</option>
            </select>
          </div>

          {locationType === 'physical' ? (
            <div className="md:col-span-2 rounded-md border border-slate-200 bg-white p-3">
              <LocationDetailsComponent
                data={locationData}
                onFieldChange={(field, value) => {
                  setLocationData((previous) => ({ ...previous, [field]: value }))
                }}
              />
            </div>
          ) : (
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">العنوان</span>
              <div className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">online</div>
              <input name="address" type="hidden" value="online" />
            </label>
          )}

          <div className="md:col-span-2">
            <SkillsField
              id="club-skills"
              label="المهارات المرتبطة بالنادي"
              value={clubSkills}
              onChange={setClubSkills}
              placeholder="ابحث عن مهارة أو أضف مهارة جديدة"
            />
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">الظهور</span>
            <select
              name="visibility"
              defaultValue={club.visibility}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            >
              <option value="public">عام</option>
              <option value="private">خاص</option>
              <option value="draft">مسودة</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-700">آلية الانضمام</span>
            <select
              name="joinPolicy"
              defaultValue={club.joinPolicy}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            >
              <option value="auto_approve">دخول مباشر</option>
              <option value="request_to_join">طلب انضمام</option>
              <option value="invite_only">بدعوة فقط</option>
            </select>
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {isSaving ? 'جار الحفظ...' : 'حفظ الإعدادات'}
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteClub()}
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              حذف النادي
            </button>
            {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
          </div>
        </form>
      ) : (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          تعديل إعدادات النادي متاح فقط لمالك المشروع ومديري المشروع.
        </p>
      )}

      {canManageClub ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-800">إضافة عضو للنادي</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={membershipNumberInput}
              onChange={(event) => setMembershipNumberInput(event.target.value)}
              placeholder="رقم العضوية"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-cyan-600"
            />
            <button
              type="button"
              onClick={() => void handleAddMember()}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              إضافة
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">أعضاء النادي ({clubMembers.length})</h3>
        {clubMembers.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">لا يوجد أعضاء في هذا النادي حالياً.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {clubMembers.map((member) => (
              <li key={`${member.clubId}-${member.membershipNumber}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.displayName}</p>
                    <p className="text-xs text-slate-500">{member.membershipNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700">
                      {MEMBER_STATUS_LABEL[member.status] ?? member.status}
                    </span>
                    {canManageClub ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member.membershipNumber)}
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        إزالة
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManageClub && pendingMembers.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <h3 className="text-sm font-semibold text-slate-900">طلبات الانضمام ({pendingMembers.length})</h3>
          <ul className="mt-3 space-y-2">
            {pendingMembers.map((member) => (
              <li key={`pending-${member.clubId}-${member.membershipNumber}`} className="rounded-md border border-amber-200 bg-white px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.displayName}</p>
                    <p className="text-xs text-slate-500">{member.membershipNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApproveOrReject(member.membershipNumber, 'active')}
                      className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      قبول
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleApproveOrReject(member.membershipNumber, 'rejected')}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
    </section>
  )
}
