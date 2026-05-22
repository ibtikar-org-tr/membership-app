import { useEffect, useState, type ReactNode } from 'react'
import { fetchProfile } from '../../../api/vms'
import type { MemberProfile } from '../../../types/profile'

function displayValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

function telegramProfileUrl(username: string) {
  const handle = username.replace(/^@/, '').trim()
  return `https://t.me/${encodeURIComponent(handle)}`
}

function formatTelegramLabel(username: string) {
  const trimmed = username.trim()
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

interface MemberInfoModalProps {
  membershipNumber: string
  displayName: string
  onClose: () => void
}

export function MemberInfoModal({ membershipNumber, displayName, onClose }: MemberInfoModalProps) {
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      setIsLoading(true)
      setHasError(false)

      try {
        const payload = await fetchProfile(membershipNumber)

        if (!controller.signal.aborted) {
          setProfile(payload.profile)
        }
      } catch {
        if (!controller.signal.aborted) {
          setProfile(null)
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      controller.abort()
    }
  }, [membershipNumber])

  const telegramUsername = profile?.telegramUsername?.trim() ?? ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <article
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-950">معلومات العضو</p>
            <p className="mt-0.5 truncate text-sm text-slate-500">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
          >
            إغلاق
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          {isLoading ? (
            <p className="text-slate-500">جار تحميل البيانات...</p>
          ) : hasError ? (
            <p className="text-red-600">تعذر تحميل معلومات العضو.</p>
          ) : profile ? (
            <>
              <InfoRow label="رقم العضوية" value={displayValue(profile.membershipNumber)} />
              <InfoRow
                label="البريد الإلكتروني"
                value={
                  profile.email.trim() ? (
                    <a
                      href={`mailto:${profile.email.trim()}`}
                      className="font-medium text-blue-700 underline-offset-2 hover:cursor-pointer hover:underline"
                    >
                      {profile.email.trim()}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow label="الاسم بالإنكليزية" value={displayValue(profile.enName)} />
              <InfoRow label="الاسم بالعربية" value={displayValue(profile.arName)} />
              <InfoRow label="رقم الهاتف" value={displayValue(profile.phoneNumber)} />
              {telegramUsername ? (
                <InfoRow
                  label="تلغرام"
                  value={
                    <a
                      href={telegramProfileUrl(telegramUsername)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 underline-offset-2 hover:cursor-pointer hover:underline"
                    >
                      {formatTelegramLabel(telegramUsername)}
                    </a>
                  }
                />
              ) : null}
            </>
          ) : null}
        </div>
      </article>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  )
}
