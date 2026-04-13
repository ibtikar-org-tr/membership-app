import { useEffect, useMemo, useState } from 'react'
import { fetchProjectMembers, fetchSkills } from '../../api/vms'
import type { VmsProjectMember, VmsSkill } from '../../types/vms'

const COMMUNITY_NOTICES = [
  'فتح باب استقبال المقترحات للجلسة الشهرية القادمة.',
  'تحديث قواعد النشر داخل القنوات المتخصصة.',
  'إضافة دليل بدايات سريعة للأعضاء الجدد.',
]

export function DashboardCommunityPage() {
  const [skills, setSkills] = useState<VmsSkill[]>([])
  const [projectMembers, setProjectMembers] = useState<VmsProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadCommunityData() {
      try {
        const [skillsPayload, membersPayload] = await Promise.all([fetchSkills(), fetchProjectMembers()])

        if (controller.signal.aborted) {
          return
        }

        setSkills(skillsPayload.skills)
        setProjectMembers(membersPayload.projectMembers)
        setHasError(false)
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

    loadCommunityData()

    return () => {
      controller.abort()
    }
  }, [])

  const membersByRole = useMemo(() => {
    return {
      manager: projectMembers.filter((member) => member.role === 'manager').length,
      member: projectMembers.filter((member) => member.role === 'member').length,
      observer: projectMembers.filter((member) => member.role === 'observer').length,
    }
  }, [projectMembers])

  const topSkills = useMemo(() => {
    return [...skills].sort((a, b) => (b.members ?? 0) - (a.members ?? 0)).slice(0, 4)
  }, [skills])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">المجتمع</h2>
          <p className="mt-1 text-sm text-slate-500">ملخص الأدوار والمهارات داخل المجتمع.</p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {skills.length} مهارة مسجلة
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {isLoading ? <p className="text-sm text-slate-500">جار تحميل بيانات المجتمع...</p> : null}
        {!isLoading && hasError ? <p className="text-sm text-red-600">تعذر تحميل بيانات المجتمع.</p> : null}
        {!isLoading && !hasError ? (
          <>
            <article className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">المدراء في المشاريع</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>عدد السجلات: {membersByRole.manager.toLocaleString('en-US')}</p>
              </div>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">الأعضاء</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>عدد السجلات: {membersByRole.member.toLocaleString('en-US')}</p>
              </div>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">المراقبون</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>عدد السجلات: {membersByRole.observer.toLocaleString('en-US')}</p>
              </div>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">إجمالي عضويات المشاريع</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>عدد السجلات: {projectMembers.length.toLocaleString('en-US')}</p>
              </div>
            </article>
          </>
        ) : null}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-semibold text-slate-900">أكثر المهارات انتشاراً</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {topSkills.map((skill) => (
            <li key={skill.name} className="rounded-md bg-white px-3 py-2">
              {skill.name} • أعضاء: {(skill.members ?? 0).toLocaleString('en-US')}
            </li>
          ))}
          {!isLoading && !hasError && topSkills.length === 0 ? <li className="rounded-md bg-white px-3 py-2">لا توجد مهارات متاحة حالياً.</li> : null}
        </ul>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm font-semibold text-slate-900">إعلانات المجتمع</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {COMMUNITY_NOTICES.map((notice) => (
            <li key={notice} className="rounded-md bg-white px-3 py-2">
              {notice}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}