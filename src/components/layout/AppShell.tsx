import { useEffect } from 'react'
import { CreditCard, LayoutDashboard, ListChecks, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useRetreatStore } from '@/store/retreatStore'

const navItems = [
  { label: 'Painel', path: '/diretoria', icon: LayoutDashboard },
  { label: 'Participantes', path: '/diretoria/participantes', icon: Users },
  { label: 'Financeiro', path: '/diretoria/financeiro', icon: CreditCard },
  { label: 'Logística', path: '/diretoria/logistica', icon: ListChecks },
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
    <div className="min-h-screen bg-[#edf4ee] text-slate-800">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(160,202,178,0.32),transparent_24%),radial-gradient(circle_at_top_right,rgba(206,226,214,0.5),transparent_24%),linear-gradient(180deg,rgba(248,252,249,0.96),rgba(232,242,235,1))]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1480px] gap-5 px-4 pb-28 pt-4 md:px-6 md:pb-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[256px] shrink-0 rounded-[28px] border border-[#a8c5b3]/45 bg-[#eef5ef]/92 p-4 shadow-[0_18px_45px_rgba(101,136,116,0.12)] xl:flex xl:flex-col">
          <div className="rounded-[22px] border border-[#a8c5b3]/35 bg-white/72 p-5">
            <p className="font-title text-[10px] uppercase tracking-[0.32em] text-[#5f8a73]">
              Retiro 2026
            </p>
            <h1 className="mt-3 font-title text-[1.7rem] leading-tight text-[#21372c]">
              Retiro da II IPR de Camacan
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#42594d]">
              Controle unificado de inscrições, finanças e logística em um painel
              limpo e responsivo.
            </p>
            <div className="mt-4 rounded-[18px] border border-[#a8c5b3]/35 bg-[#dcebe1] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#567262]">
                Área interna
              </p>
              <p className="mt-2 text-sm text-[#244032]">Painel da organização</p>
              <p className="mt-1 text-xs text-[#4c6457]">
                Gestão interna sem etapa de autenticação.
              </p>
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
                      ? 'border-[#8eb39d]/55 bg-white/85 text-[#1f352b]'
                      : 'border-transparent bg-transparent text-[#42594d] hover:border-[#a8c5b3]/45 hover:bg-white/70 hover:text-[#21372c]',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="rounded-[22px] border border-[#a8c5b3]/35 bg-white/72 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#567262]">
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
              <span className="text-sm leading-6 text-slate-700">
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
              <p className="mt-3 text-xs leading-5 text-rose-700/90">{error}</p>
            ) : null}
          </div>
        </aside>

        <main className="relative flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-20 rounded-[24px] border border-[#a8c5b3]/45 bg-[#eef5ef]/95 p-2 backdrop-blur xl:hidden">
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
                    ? 'bg-white/82 text-[#1f352b]'
                    : 'text-[#42594d] hover:bg-white/70 hover:text-[#20372c]',
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
