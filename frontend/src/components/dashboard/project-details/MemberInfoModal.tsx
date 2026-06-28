import { useEffect, useState, type ReactNode } from 'react'
import { fetchEventRegistrantContact, fetchProjectMemberContact } from '../../../api/vms'
import type { VmsProjectMemberContact } from '../../../types/vms'

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

type MemberInfoModalProps = {
  membershipNumber: string
  displayName: string
  onClose: () => void
} & (
  | { projectId: string; eventId?: never }
  | { eventId: string; projectId?: never }
)

export function MemberInfoModal({ projectId, eventId, membershipNumber, displayName, onClose }: MemberInfoModalProps) {
  const [contact, setContact] = useState<VmsProjectMemberContact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadContact() {
      setIsLoading(true)
      setHasError(false)

      try {
        let payload: { contact: VmsProjectMemberContact }

        if (eventId) {
          payload = await fetchEventRegistrantContact(eventId, membershipNumber)
        } else if (projectId) {
          payload = await fetchProjectMemberContact(projectId, membershipNumber)
        } else {
          throw new Error('Missing project or event context.')
        }

        if (!controller.signal.aborted) {
          setContact(payload.contact)
        }
      } catch {
        if (!controller.signal.aborted) {
          setContact(null)
          setHasError(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadContact()

    return () => {
      controller.abort()
    }
  }, [eventId, membershipNumber, projectId])

  const telegramUsername = contact?.telegramUsername?.trim() ?? ''

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
          ) : contact ? (
            <>
              <InfoRow label="رقم العضوية" value={displayValue(contact.membershipNumber)} />
              <InfoRow
                label="البريد الإلكتروني"
                value={
                  contact.email.trim() ? (
                    <a
                      href={`mailto:${contact.email.trim()}`}
                      className="font-medium text-blue-700 underline-offset-2 hover:cursor-pointer hover:underline"
                    >
                      {contact.email.trim()}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow label="الاسم بالإنكليزية" value={displayValue(contact.enName)} />
              <InfoRow label="الاسم بالعربية" value={displayValue(contact.arName)} />
              <InfoRow label="رقم الهاتف" value={displayValue(contact.phoneNumber)} />
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
