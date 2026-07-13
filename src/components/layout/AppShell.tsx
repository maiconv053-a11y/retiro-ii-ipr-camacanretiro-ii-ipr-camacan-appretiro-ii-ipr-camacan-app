import { useEffect } from 'react'
import { CreditCard, LayoutDashboard, ListChecks, LogOut, Users } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useRetreatStore } from '@/store/retreatStore'

const navItems = [
  { label: 'Painel', path: '/diretoria', icon: LayoutDashboard },
  { label: 'Participantes', path: '/diretoria/participantes', icon: Users },
  { label: 'Financeiro', path: '/diretoria/financeiro', icon: CreditCard },
  { label: 'Logística', path: '/diretoria/logistica', icon: ListChecks },
]

export function AppShell() {
  const navigate = useNavigate()
  const initialize = useRetreatStore((state) => state.initialize)
  const reset = useRetreatStore((state) => state.reset)
  const loading = useRetreatStore((state) => state.loading)
  const syncing = useRetreatStore((state) => state.syncing)
  const error = useRetreatStore((state) => state.error)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    void initialize()
  }, [initialize])

  async function handleLogout() {
    await logout()
    reset()
    navigate('/diretoria/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#020611] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.06),transparent_20%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(2,6,23,1))]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1480px] gap-5 px-4 pb-28 pt-4 md:px-6 md:pb-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[256px] shrink-0 rounded-[28px] border border-white/10 bg-[#08111d]/88 p-4 xl:flex xl:flex-col">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.02] p-5">
            <p className="font-title text-[10px] uppercase tracking-[0.32em] text-cyan-300/58">
              Retiro 2026
            </p>
            <h1 className="mt-3 font-title text-[1.7rem] leading-tight text-white">
              Retiro da II IPR de Camacan
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Controle unificado de inscrições, finanças e logística em um painel
              limpo e responsivo.
            </p>
            <div className="mt-4 rounded-[18px] border border-white/10 bg-[#060d18] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Sessão ativa
              </p>
              <p className="mt-2 text-sm text-white">{user?.name ?? 'Diretoria'}</p>
              <p className="mt-1 text-xs text-slate-400">{user?.email ?? ''}</p>
            </div>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-2">
            {navItems.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/diretoria'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm transition',
                    isActive
                      ? 'border-white/14 bg-white/[0.06] text-white'
                      : 'border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-100',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Estado do sistema
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  error
                    ? 'bg-rose-400'
                    : loading || syncing
                      ? 'bg-amber-400'
                      : 'bg-emerald-400',
                )}
              />
              <span className="text-sm leading-6 text-slate-300">
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
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-white/16 hover:bg-white/[0.06]"
            >
              <LogOut className="h-4 w-4" />
              Sair da diretoria
            </button>
          </div>
        </aside>

        <main className="relative flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-20 rounded-[24px] border border-white/10 bg-[#08111d]/92 p-2 backdrop-blur xl:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/diretoria'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-[18px] px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition',
                  isActive
                    ? 'bg-white/[0.06] text-white'
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
