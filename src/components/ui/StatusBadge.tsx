import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'cyan' | 'violet' | 'green' | 'amber' | 'rose'

const toneClasses: Record<Tone, string> = {
  cyan: 'border-cyan-400/20 bg-cyan-400/8 text-cyan-100',
  violet:
    'border-violet-400/20 bg-violet-400/8 text-violet-100',
  green: 'border-emerald-400/20 bg-emerald-400/8 text-emerald-100',
  amber: 'border-amber-400/20 bg-amber-400/8 text-amber-100',
  rose: 'border-rose-400/20 bg-rose-400/8 text-rose-100',
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
