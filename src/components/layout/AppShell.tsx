import { useEffect } from 'react'
import { CreditCard, LayoutDashboard, ListChecks, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useRetreatStore } from '@/store/retreatStore'

const navItems = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Participantes', path: '/participantes', icon: Users },
  { label: 'Financeiro', path: '/financeiro', icon: CreditCard },
  { label: 'Logística', path: '/logistica', icon: ListChecks },
]

export function AppShell() {
  const initialize = useRetreatStore((state) => state.initialize)
  const loading = useRetreatStore((state) => state.loading)
  const syncing = useRetreatStore((state) => state.syncing)
  const error = useRetreatStore((state) => state.error)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <div className="min-h-screen bg-[#020611] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_20%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,1))]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.09]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 pb-28 pt-4 md:px-6 md:pb-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur xl:flex xl:flex-col">
          <div className="rounded-[28px] border border-cyan-400/20 bg-[#071120] p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
            <p className="font-title text-[11px] uppercase tracking-[0.38em] text-cyan-300/70">
              Retiro 2026
            </p>
            <h1 className="mt-3 font-title text-2xl text-white">
              Retiro da II IPR de Camacan
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Controle unificado de inscrições, finanças e logística em um painel
              limpo e responsivo.
            </p>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-2">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition',
                    isActive
                      ? 'border-cyan-400/30 bg-cyan-400/10 text-white shadow-[0_0_40px_rgba(34,211,238,0.12)]'
                      : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-100',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Estado do sistema
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full shadow-[0_0_16px_rgba(52,211,153,0.9)]',
                  error
                    ? 'bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.9)]'
                    : loading || syncing
                      ? 'bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.9)]'
                      : 'bg-emerald-400',
                )}
              />
              <span className="text-sm text-slate-300">
                {error
                  ? 'Falha de conexão com a base de dados'
                  : loading
                    ? 'Carregando dados em nuvem'
                    : syncing
                      ? 'Sincronizando com a nuvem'
                      : 'Dados sincronizados com o banco em nuvem'}
              </span>
            </div>
            {error ? (
              <p className="mt-3 text-xs leading-5 text-rose-200/80">{error}</p>
            ) : null}
          </div>
        </aside>

        <main className="relative flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-20 rounded-[28px] border border-white/10 bg-[#071120]/90 p-2 backdrop-blur xl:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-[20px] px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition',
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-200'
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200',
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
