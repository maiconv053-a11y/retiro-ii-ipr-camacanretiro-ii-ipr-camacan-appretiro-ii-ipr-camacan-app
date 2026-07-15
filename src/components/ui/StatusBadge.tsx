import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'cyan' | 'violet' | 'green' | 'amber' | 'rose'

const toneClasses: Record<Tone, string> = {
  cyan: 'border-[#9dc4ad]/55 bg-[#e8f3eb] text-[#345745]',
  violet: 'border-[#b4cfbf]/55 bg-[#edf5ef] text-[#406350]',
  green: 'border-[#89b39a]/55 bg-[#dcece2] text-[#27513d]',
  amber: 'border-amber-300/45 bg-amber-50 text-amber-700',
  rose: 'border-rose-300/45 bg-rose-50 text-rose-700',
}

interface StatusBadgeProps {
  label: string
  tone?: Tone
  icon?: ReactNode
  className?: string
}

export function StatusBadge({
  label,
  tone = 'cyan',
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em]',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  )
}
