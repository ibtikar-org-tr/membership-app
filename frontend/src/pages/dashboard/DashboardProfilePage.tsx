import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { fetchProfile, updateProfile } from '../../api/vms'
import type { MemberProfile } from '../../types/profile'
import type { RegistrationFormData } from '../../types/registration'
import { getStoredUser } from '../../utils/auth'
import { formatDateEnCA } from '../../utils/date-format'
import { Edit2, Save, X } from 'lucide-react'

const PersonalInfoSection = lazy(() =>
  import('../../components/registration/sections/PersonalInfoSection').then((module) => ({ default: module.PersonalInfoSection })),
)
const EducationSection = lazy(() =>
  import('../../components/registration/sections/EducationSection').then((module) => ({ default: module.EducationSection })),
)
const ProfileSection = lazy(() =>
  import('../../components/registration/sections/ProfileSection').then((module) => ({ default: module.ProfileSection })),
)

const READ_ONLY_FIELDS = new Set(['membershipNumber', 'email', 'telegramId', 'telegramUsername'])

function profileToFormData(profile: MemberProfile): RegistrationFormData {
  return {
    email: profile.email,
    enName: profile.enName ?? '',
    arName: profile.arName ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    sex: profile.sex ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    country: profile.country ?? '',
    region: profile.region ?? '',
    city: profile.city ?? '',
    address: profile.address ?? '',
    educationLevel: profile.educationLevel ?? '',
    school: profile.school ?? '',
    graduationYear: profile.graduationYear?.toString() ?? '',
    fieldOfStudy: profile.fieldOfStudy ?? '',
    bloodType: profile.bloodType ?? '',
    socialMediaLinks: profile.socialMediaLinks ?? '',
    interests: profile.interests ?? '',
    skills: profile.skills ?? '',
    languages: profile.languages ?? '',
    whereHeardAboutUs: '',
    motivationLetter: '',
    friendsOnPlatform: '',
    interestInVolunteering: '',
    previousExperience: '',
    bylawsAcknowledgement: '',
  }
}

export function DashboardProfilePage() {
  const membershipNumber = getStoredUser()?.membershipNumber ?? null
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [formData, setFormData] = useState<RegistrationFormData | null>(null)

  useEffect(() => {
    if (!membershipNumber) {
      setHasError(true)
      setIsLoading(false)
      return
    }

    const currentMembershipNumber = membershipNumber

    setIsLoading(true)

    const controller = new AbortController()

    async function loadProfile() {
      try {
        const payload = await fetchProfile(currentMembershipNumber)

        if (!controller.signal.aborted) {
          setProfile(payload.profile)
          setFormData(profileToFormData(payload.profile))
          setHasError(false)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      controller.abort()
    }
  }, [membershipNumber])

  const handleEditClick = () => {
    setIsEditMode(true)
    setSaveError('')
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setSaveError('')
    if (profile && formData) {
      setFormData(profileToFormData(profile))
    }
  }

  const handleFieldChange = (field: keyof RegistrationFormData, value: string) => {
    if (READ_ONLY_FIELDS.has(field)) {
      return
    }
    setFormData((prev) => {
      if (!prev) return null
      return { ...prev, [field]: value }
    })
  }

  const handleSave = async () => {
    if (!membershipNumber || !formData) {
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const updatePayload = {
        enName: formData.enName,
        arName: formData.arName,
        phoneNumber: formData.phoneNumber,
        sex: formData.sex,
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        region: formData.region,
        city: formData.city,
        address: formData.address,
        educationLevel: formData.educationLevel,
        school: formData.school,
        graduationYear: formData.graduationYear ? Number.parseInt(formData.graduationYear, 10) : undefined,
        fieldOfStudy: formData.fieldOfStudy,
        bloodType: formData.bloodType,
        socialMediaLinks: formData.socialMediaLinks,
        interests: formData.interests,
        skills: formData.skills,
        languages: formData.languages,
      }

      const response = await updateProfile(membershipNumber, updatePayload)
      setProfile(response.profile)
      setFormData(profileToFormData(response.profile))
      setIsEditMode(false)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ البيانات')
    } finally {
      setIsSaving(false)
    }
  }

  const profileRows = useMemo(() => {
    const fallback = '-'
    const sexLabel = profile?.sex === 'male' ? 'ذكر' : profile?.sex === 'female' ? 'أنثى' : (profile?.sex ?? fallback)

    return [
      { label: 'الاسم بالإنكليزية', value: profile?.enName ?? fallback, field: 'enName' },
      { label: 'الاسم بالعربية', value: profile?.arName ?? fallback, field: 'arName' },
      { label: 'البريد الإلكتروني', value: profile?.email ?? fallback, field: 'email' },
      { label: 'رقم العضوية', value: profile?.membershipNumber ?? fallback, field: 'membershipNumber' },
      { label: 'رقم الهاتف', value: profile?.phoneNumber ?? fallback, field: 'phoneNumber' },
      { label: 'الجنس', value: sexLabel, field: 'sex' },
      { label: 'تاريخ الميلاد', value: profile?.dateOfBirth ? formatDateEnCA(profile.dateOfBirth) : fallback, field: 'dateOfBirth' },
      { label: 'الدولة', value: profile?.country ?? fallback, field: 'country' },
      { label: 'المنطقة', value: profile?.region ?? fallback, field: 'region' },
      { label: 'المدينة', value: profile?.city ?? fallback, field: 'city' },
      { label: 'العنوان', value: profile?.address ?? fallback, field: 'address' },
      { label: 'المستوى التعليمي', value: profile?.educationLevel ?? fallback, field: 'educationLevel' },
      { label: 'المدرسة / الجامعة', value: profile?.school ?? fallback, field: 'school' },
      { label: 'سنة التخرج', value: profile?.graduationYear ? String(profile.graduationYear) : fallback, field: 'graduationYear' },
      { label: 'مجال الدراسة', value: profile?.fieldOfStudy ?? fallback, field: 'fieldOfStudy' },
      { label: 'زمرة الدم', value: profile?.bloodType ?? fallback, field: 'bloodType' },
      { label: 'المهارات', value: profile?.skills ?? fallback, field: 'skills' },
      { label: 'اللغات', value: profile?.languages ?? fallback, field: 'languages' },
    ]
  }, [profile])

  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </section>
    )
  }

  if (hasError) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-5 sm:p-6">
        <p className="text-sm text-red-600">تعذر تحميل بيانات الملف الشخصي.</p>
      </section>
    )
  }

  if (!profile || !formData) {
    return null
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الملف الشخصي</h2>
          <p className="mt-1 text-sm text-slate-500">{isEditMode ? 'تعديل البيانات الشخصية' : 'بيانات الملف الشخصي من قاعدة البيانات'}</p>
        </div>
        <div className="flex gap-2">
          {!isEditMode ? (
            <button
              onClick={handleEditClick}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <Edit2 className="h-4 w-4" />
              تعديل
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{saveError}</p>
        </div>
      )}

      {!isEditMode ? (
        <div className="grid gap-3 md:grid-cols-2">
          {profileRows.map((row) => (
            <div
              key={row.label}
              className={`rounded-lg border px-4 py-3 ${
                READ_ONLY_FIELDS.has(row.field as any) ? 'border-slate-200 bg-slate-100/50' : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <p className="text-xs font-medium text-slate-500">{row.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{row.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-slate-100" />}>
            <PersonalInfoSection data={formData} onFieldChange={handleFieldChange} readOnlyFields={READ_ONLY_FIELDS} />
          </Suspense>
          <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-slate-100" />}>
            <EducationSection data={formData} onFieldChange={handleFieldChange} />
          </Suspense>
          <Suspense fallback={<div className="h-28 animate-pulse rounded-2xl bg-slate-100" />}>
            <ProfileSection data={formData} onFieldChange={handleFieldChange} />
          </Suspense>
        </div>
      )}
    </section>
  )
}