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
    <div className="flex flex-col gap-4 rounded-[24px] border border-white/8 bg-white/[0.02] p-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="font-title text-[10px] uppercase tracking-[0.28em] text-cyan-300/58">
          {eyebrow}
        </p>
        <h1 className="font-title text-[1.9rem] leading-tight text-white md:text-[2.2rem]">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  )
}
