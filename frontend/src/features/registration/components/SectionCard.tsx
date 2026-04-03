import type { ReactNode } from 'react'

type SectionCardProps = {
  title: string
  subtitle: string
  children: ReactNode
  className?: string
}

export function SectionCard({ title, subtitle, children, className = '' }: SectionCardProps) {
  return (
    <section
      className={`relative rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-md backdrop-blur md:p-6 ${className}`}
    >
      <header className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </header>
      {children}
    </section>
  )
}
