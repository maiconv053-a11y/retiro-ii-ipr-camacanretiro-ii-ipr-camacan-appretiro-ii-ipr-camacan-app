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
  cyan: 'from-[#7fb290]/30 to-transparent text-[#315644]',
  violet: 'from-[#a3c7b0]/32 to-transparent text-[#385e4a]',
  green: 'from-[#6f9f80]/28 to-transparent text-[#294c3a]',
}

const iconAccentClasses = {
  cyan: 'text-[#315644]',
  violet: 'text-[#385e4a]',
  green: 'text-[#294c3a]',
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
        <div className="rounded-2xl border border-[#b7d0bf]/45 bg-white/78 p-3 text-[#274233]">
          {icon}
        </div>
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {to ? ctaLabel : 'Resumo'}
          <ArrowUpRight className={`h-3.5 w-3.5 ${iconAccentClasses[accent]}`} />
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 font-title text-[2rem] leading-none text-[#20352a]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{hint}</p>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-[24px] border border-[#aac4b3]/40 bg-[#f2f8f3]/92 p-5 transition hover:-translate-y-0.5 hover:border-[#8eb39d]/55 hover:bg-white/92 focus:outline-none focus:ring-2 focus:ring-[#7da98d]/35"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#aac4b3]/40 bg-[#f2f8f3]/92 p-5">
      {content}
    </div>
  )
}
