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
    <div className="rounded-[24px] border border-[#a8c5b3]/40 bg-[#dcebe1]/90 p-6 shadow-[0_16px_36px_rgba(101,136,116,0.1)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="w-full font-title text-[1.9rem] leading-tight text-[#20352a] md:text-[2.2rem]">
          {title}
        </h1>
        {action ?? null}
      </div>
    </div>
  )
}
