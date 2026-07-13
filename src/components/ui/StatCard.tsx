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
  cyan: 'from-cyan-400/12 to-transparent text-cyan-100',
  violet: 'from-violet-400/12 to-transparent text-violet-100',
  green: 'from-emerald-400/12 to-transparent text-emerald-100',
}

const iconAccentClasses = {
  cyan: 'text-cyan-100',
  violet: 'text-violet-100',
  green: 'text-emerald-100',
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
      <div className="mb-8 flex items-center justify-between">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-slate-100">
          {icon}
        </div>
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {to ? ctaLabel : 'Resumo'}
          <ArrowUpRight className={`h-3.5 w-3.5 ${iconAccentClasses[accent]}`} />
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 font-title text-[2rem] leading-none text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{hint}</p>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-[24px] border border-white/10 bg-[#08111f]/88 p-5 transition hover:-translate-y-0.5 hover:border-white/16 hover:bg-[#0a1424] focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#08111f]/88 p-5">
      {content}
    </div>
  )
}
