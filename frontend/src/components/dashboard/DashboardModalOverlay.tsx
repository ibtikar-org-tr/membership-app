import type { ReactNode } from 'react'

type DashboardModalOverlayProps = {
  children: ReactNode
  onClose?: () => void
  className?: string
  layout?: 'sheet' | 'center'
}

const OVERLAY_BASE =
  'fixed inset-0 flex justify-center lg:inset-y-0 lg:left-0 lg:right-[var(--dashboard-sidebar-width,20rem)]'

const LAYOUT_CLASS = {
  sheet: 'items-end p-0 sm:items-center sm:p-4',
  center: 'items-center p-4',
} as const

export function DashboardModalOverlay({
  children,
  onClose,
  className = '',
  layout = 'sheet',
}: DashboardModalOverlayProps) {
  return (
    <div className={`${OVERLAY_BASE} ${LAYOUT_CLASS[layout]} ${className}`.trim()} onClick={onClose}>
      {children}
    </div>
  )
}
