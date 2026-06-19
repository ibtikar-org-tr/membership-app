import { Link } from 'react-router-dom'
import {
  FiCalendar,
  FiGitBranch,
  FiHeart,
  FiLogOut,
  FiPlus,
  FiSend,
  FiSettings,
  FiUsers,
} from 'react-icons/fi'
import type { ReactNode } from 'react'
import type { VmsProject, VmsProjectMember } from '../../../types/vms'
import { formatDateEnCA } from '../../../utils/date-format'
import { memberAvatarTone, memberInitials, statusBadgeClass, statusLabel } from './helpers'

const toolbarBtn =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50'
const toolbarBtnPrimary =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800'
const toolbarBtnCyan =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60'
const toolbarBtnDanger =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100'
const toolbarIcon = 'h-3.5 w-3.5 shrink-0 opacity-80'

interface ProjectHeaderProps {
  project: VmsProject
  parentProjectName: string | null
  ownerDisplayName: string | null
  ownerFallbackName: string
  memberCount: number
  projectMembers: VmsProjectMember[]
  previewMembers: VmsProjectMember[]
  hiddenMembersCount: number
  canCreateTask: boolean
  canManageProject: boolean
  onOpenAddTask: () => void
  eventsPath: string
  clubsPath: string
  positionsPath: string
  onOpenMembers: () => void
  onOpenProjectSettings: () => void
  subProjectsPath: string
  showTelegramInvite?: boolean
  isSendingTelegramInvite?: boolean
  onSendTelegramInvite?: () => void
  telegramInviteFeedback?: string | null
  telegramInviteFeedbackIsError?: boolean
  canLeaveProject?: boolean
  onLeaveProject?: () => void
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
  canCreateTask,
  canManageProject,
  onOpenAddTask,
  eventsPath,
  clubsPath,
  positionsPath,
  onOpenMembers,
  onOpenProjectSettings,
  subProjectsPath,
  showTelegramInvite = false,
  isSendingTelegramInvite = false,
  onSendTelegramInvite,
  telegramInviteFeedback = null,
  telegramInviteFeedbackIsError = false,
  canLeaveProject = false,
  onLeaveProject,
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
                <p className="mt-1 text-xs text-slate-200">
                  {project.telegramGroupId ? 'مجموعة تلغرام مرتبطة' : 'لا توجد مجموعة تلغرام'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_55%,_#e2e8f0)] p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/85 p-2 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2">
            {canCreateTask ? (
              <button type="button" onClick={onOpenAddTask} className={toolbarBtnPrimary}>
                <FiPlus className={toolbarIcon} aria-hidden />
                إضافة مهمة
              </button>
            ) : null}
            <Link to={eventsPath} className={toolbarBtn}>
              <FiCalendar className={toolbarIcon} aria-hidden />
              الفعاليات
            </Link>
            <Link to={clubsPath} className={toolbarBtn}>
              <FiUsers className={toolbarIcon} aria-hidden />
              الأندية
            </Link>
            <Link to={positionsPath} className={toolbarBtn}>
              <FiHeart className={toolbarIcon} aria-hidden />
              الفرص التطوعية
            </Link>
            <Link to={subProjectsPath} className={toolbarBtn}>
              <FiGitBranch className={toolbarIcon} aria-hidden />
              المشاريع الفرعية
            </Link>
            <button
              type="button"
              onClick={onOpenMembers}
              className={`${toolbarBtn} min-w-0 max-w-full`}
              title="عرض أعضاء المشروع"
            >
              <div className="flex shrink-0 -space-x-1.5 rtl:space-x-reverse">
                {previewMembers.map((member) => (
                  <span
                    key={`member-preview-${member.projectId}-${member.membershipNumber}`}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold shadow-sm sm:h-6 sm:w-6 sm:border ${memberAvatarTone(member.membershipNumber)}`}
                  >
                    {memberInitials(member.displayName, member.membershipNumber)}
                  </span>
                ))}
                {hiddenMembersCount > 0 ? (
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 px-1 text-[10px] font-semibold text-slate-700 shadow-sm sm:h-6 sm:min-w-6 sm:border-slate-300">
                    +{hiddenMembersCount}
                  </span>
                ) : null}
                {projectMembers.length === 0 ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[10px] font-semibold text-slate-600 shadow-sm sm:h-6 sm:w-6">
                    0
                  </span>
                ) : null}
              </div>
              <span className="truncate">
                الأعضاء
                {memberCount > 0 ? ` (${memberCount})` : ''}
              </span>
            </button>
            {showTelegramInvite && onSendTelegramInvite ? (
              <button
                type="button"
                onClick={onSendTelegramInvite}
                disabled={isSendingTelegramInvite}
                title="إرسال دعوة مجموعة التلغرام عبر البوت"
                className={toolbarBtnCyan}
              >
                <FiSend className={toolbarIcon} aria-hidden />
                <span className="hidden sm:inline">{isSendingTelegramInvite ? 'جار الإرسال...' : 'دعوة تلغرام'}</span>
              </button>
            ) : null}
          </div>
          <div className="flex h-9 flex-wrap items-center justify-end gap-2">
            {telegramInviteFeedback ? (
              <span
                className={`max-w-[12rem] truncate text-xs sm:max-w-xs ${telegramInviteFeedbackIsError ? 'text-red-600' : 'text-emerald-700'}`}
                title={telegramInviteFeedback}
              >
                {telegramInviteFeedback}
              </span>
            ) : null}
            {canLeaveProject && onLeaveProject ? (
              <button
                type="button"
                onClick={onLeaveProject}
                className={toolbarBtnDanger}
                title="مغادرة المشروع"
              >
                <FiLogOut className={toolbarIcon} aria-hidden />
                <span className="hidden sm:inline">مغادرة المشروع</span>
              </button>
            ) : null}
            {canManageProject ? (
              <button
                type="button"
                onClick={onOpenProjectSettings}
                aria-label="إعدادات المشروع"
                title="إعدادات المشروع"
                className={`${toolbarBtn} w-9 justify-center px-0`}
              >
                <FiSettings className={toolbarIcon} />
              </button>
            ) : null}
            <span className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
              آخر تحديث: {formatDateEnCA(project.updatedAt)}
            </span>
          </div>
        </div>

        {children}
      </div>
    </>
  )
}
