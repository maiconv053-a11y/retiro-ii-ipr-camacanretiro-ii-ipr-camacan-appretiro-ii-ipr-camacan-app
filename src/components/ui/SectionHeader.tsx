import type { ReactNode } from 'react'

interface SectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: string
  action?: ReactNode
}

export function SectionHeader({
  title,
  action,
}: SectionHeaderProps) {
  return (
    <div className="rounded-[24px] border border-emerald-100/10 bg-[#102019]/82 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="w-full font-title text-[1.9rem] leading-tight text-white md:text-[2.2rem]">
          {title}
        </h1>
        {action ?? null}
      </div>
    </div>
  )
}
