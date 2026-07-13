import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatCardProps {
  label: string
  value: string
  hint: string
  accent?: 'cyan' | 'violet' | 'green'
  icon: ReactNode
  to?: string
  ctaLabel?: string
}

const accentClasses = {
  cyan: 'from-cyan-400/20 to-transparent text-cyan-200',
  violet: 'from-violet-400/20 to-transparent text-violet-200',
  green: 'from-emerald-400/20 to-transparent text-emerald-200',
}

const iconAccentClasses = {
  cyan: 'text-cyan-200',
  violet: 'text-violet-200',
  green: 'text-emerald-200',
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'cyan',
  icon,
  to,
  ctaLabel = 'Abrir módulo',
}: StatCardProps) {
  const content = (
    <>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentClasses[accent]}`} />
      <div className="mb-6 flex items-center justify-between">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-slate-100">
          {icon}
        </div>
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          {to ? ctaLabel : 'Resumo'}
          <ArrowUpRight className={`h-4 w-4 ${iconAccentClasses[accent]}`} />
        </span>
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 font-title text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1222]/90 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.45)] transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#0c1629] focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a1222]/90 p-5 shadow-[0_24px_80px_rgba(2,8,23,0.45)]">
      {content}
    </div>
  )
}
