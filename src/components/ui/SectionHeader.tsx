import type { ReactNode } from 'react'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="font-title text-[11px] uppercase tracking-[0.35em] text-cyan-300/70">
          {eyebrow}
        </p>
        <h1 className="font-title text-2xl text-white md:text-[2rem]">{title}</h1>
        <p className="max-w-2xl text-sm text-slate-300/72">{description}</p>
      </div>
      {action}
    </div>
  )
}
