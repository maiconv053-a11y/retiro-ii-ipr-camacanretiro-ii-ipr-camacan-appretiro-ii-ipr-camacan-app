import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'cyan' | 'violet' | 'green' | 'amber' | 'rose'

const toneClasses: Record<Tone, string> = {
  cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.12)]',
  violet:
    'border-violet-400/30 bg-violet-400/10 text-violet-200 shadow-[0_0_24px_rgba(167,139,250,0.12)]',
  green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.12)]',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.12)]',
  rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200 shadow-[0_0_24px_rgba(251,113,133,0.12)]',
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
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em]',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  )
}
