import { Link } from 'react-router-dom'
import { FiSettings } from 'react-icons/fi'
import type { ReactNode } from 'react'
import type { VmsProject, VmsProjectMember } from '../../../types/vms'
import { formatDateEnCA } from '../../../utils/date-format'
import { memberAvatarTone, memberInitials, statusBadgeClass, statusLabel } from './helpers'

interface ProjectHeaderProps {
  project: VmsProject
  parentProjectName: string | null
  ownerDisplayName: string | null
  ownerFallbackName: string
  memberCount: number
  projectMembers: VmsProjectMember[]
  previewMembers: VmsProjectMember[]
  hiddenMembersCount: number
  onOpenAddTask: () => void
  onOpenMembers: () => void
  onOpenProjectSettings: () => void
  children?: ReactNode
}

export function ProjectHeader({
  project,
  parentProjectName,
  ownerDisplayName,
  ownerFallbackName,
  memberCount,
  projectMembers,
  previewMembers,
  hiddenMembersCount,
  onOpenAddTask,
  onOpenMembers,
  onOpenProjectSettings,
  children,
}: ProjectHeaderProps) {
  return (
    <>
      <header className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-cyan-950 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(project.status)}`}>
                  {statusLabel(project.status)}
                </span>
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  {project.parentProjectId ? `مشروع فرعي • ${parentProjectName ?? project.parentProjectId}` : 'مشروع رئيسي'}
                </span>
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  {memberCount} عضو
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-100/80">لوحة المشروع</p>
                <h2 className="mt-1.5 text-xl font-semibold text-white sm:text-2xl">{project.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-200">
                  {project.description ?? 'لا يوجد وصف للمشروع حالياً.'}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[20rem] lg:grid-cols-1">
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                العودة للمشاريع
              </Link>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                <p className="text-xs text-cyan-100/80">المسؤول</p>
                <p className="mt-1 text-sm font-semibold text-white">{ownerDisplayName ?? ownerFallbackName}</p>
                <p className="mt-1 text-xs text-slate-200">{project.telegramGroupId ?? 'لا توجد مجموعة تلغرام مرتبطة'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_55%,_#e2e8f0)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 p-2 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddTask}
              className="inline-flex items-center rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              + إضافة مهمة
            </button>
            <button
              type="button"
              onClick={onOpenMembers}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              title="عرض أعضاء المشروع"
            >
              <div className="flex -space-x-2">
                {previewMembers.map((member) => (
                  <span
                    key={`member-preview-${member.projectId}-${member.membershipNumber}`}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm ${memberAvatarTone(member.membershipNumber)}`}
                  >
                    {memberInitials(member.displayName, member.membershipNumber)}
                  </span>
                ))}
                {hiddenMembersCount > 0 ? (
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-700 shadow-sm">
                    (+{hiddenMembersCount})
                  </span>
                ) : null}
                {projectMembers.length === 0 ? (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-600 shadow-sm">
                    0
                  </span>
                ) : null}
              </div>
              <span className="hidden sm:inline">الأعضاء</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProjectSettings}
              aria-label="إعدادات المشروع"
              title="إعدادات المشروع"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 transition hover:bg-slate-50"
            >
              <FiSettings className="h-3.5 w-3.5" />
            </button>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              آخر تحديث: {formatDateEnCA(project.updatedAt)}
            </span>
          </div>
        </div>

        {children}
      </div>
    </>
  )
}
