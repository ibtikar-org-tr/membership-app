import { useEffect, useMemo, useState } from 'react'
import { fetchProfile } from '../../api/vms'
import type { MemberProfile } from '../../types/profile'
import { getStoredUser } from '../../utils/auth'
import { formatDateEnCA } from '../../utils/date-format'

export function DashboardProfilePage() {
  const membershipNumber = getStoredUser()?.membershipNumber ?? null
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

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

  const profileRows = useMemo(() => {
    const fallback = '-'
    const sexLabel = profile?.sex === 'male' ? 'ذكر' : profile?.sex === 'female' ? 'أنثى' : (profile?.sex ?? fallback)

    return [
      { label: 'الاسم بالإنكليزية', value: profile?.enName ?? fallback },
      { label: 'الاسم بالعربية', value: profile?.arName ?? fallback },
      { label: 'البريد الإلكتروني', value: profile?.email ?? fallback },
      { label: 'رقم العضوية', value: profile?.membershipNumber ?? fallback },
      { label: 'رقم الهاتف', value: profile?.phoneNumber ?? fallback },
      { label: 'الجنس', value: sexLabel },
      { label: 'تاريخ الميلاد', value: profile?.dateOfBirth ? formatDateEnCA(profile.dateOfBirth) : fallback },
      { label: 'الدولة', value: profile?.country ?? fallback },
      { label: 'المنطقة', value: profile?.region ?? fallback },
      { label: 'المدينة', value: profile?.city ?? fallback },
      { label: 'العنوان', value: profile?.address ?? fallback },
      { label: 'المستوى التعليمي', value: profile?.educationLevel ?? fallback },
      { label: 'المدرسة / الجامعة', value: profile?.school ?? fallback },
      { label: 'سنة التخرج', value: profile?.graduationYear ? String(profile.graduationYear) : fallback },
      { label: 'مجال الدراسة', value: profile?.fieldOfStudy ?? fallback },
      { label: 'زمرة الدم', value: profile?.bloodType ?? fallback },
      { label: 'المهارات', value: profile?.skills ?? fallback },
      { label: 'اللغات', value: profile?.languages ?? fallback },
    ]
  }, [profile])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">الملف الشخصي</h2>
          <p className="mt-1 text-sm text-slate-500">بيانات الملف الشخصي من قاعدة البيانات.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          حالة الحساب: {profile ? 'مكتمل' : 'غير متاح'}
        </span>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-slate-500">جار تحميل بيانات الملف الشخصي...</p> : null}
      {!isLoading && hasError ? <p className="mt-4 text-sm text-red-600">تعذر تحميل بيانات الملف الشخصي.</p> : null}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {!isLoading && !hasError && profileRows.map((row) => (
          <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{row.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}