import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function DirectorLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const initialized = useAuthStore((state) => state.initialized)
  const initialize = useAuthStore((state) => state.initialize)
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    '/diretoria'

  const isValid = useMemo(
    () => email.trim().length >= 5 && password.trim().length >= 6,
    [email, password],
  )

  useEffect(() => {
    if (!initialized && !loading) {
      void initialize()
    }
  }, [initialize, initialized, loading])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValid) {
      setError('Informe um e-mail válido e a senha da diretoria.')
      return
    }

    setError(null)

    try {
      await login({
        email: email.trim(),
        password,
      })

      navigate(redirectPath, { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Falha ao autenticar diretoria.',
      )
    }
  }

  if (initialized && user) {
    return <Navigate to="/diretoria" replace />
  }

  return (
    <div className="min-h-screen bg-[#020611] px-4 py-8 text-slate-100 md:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.07),transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(2,6,23,1))]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <section className="rounded-[28px] border border-white/10 bg-[#08111d]/88 p-6 md:p-8">
          <p className="font-title text-[10px] uppercase tracking-[0.32em] text-cyan-300/60">
            Área privada
          </p>
          <h1 className="mt-4 font-title text-3xl leading-tight text-white md:text-4xl">
            Login da diretoria
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Acesso restrito às telas internas de participantes, financeiro e checklist de
            organização. Toda ação sensível exige autenticação prévia.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-sm font-medium text-white">Rotas protegidas</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Sem token válido, a listagem de participantes, o financeiro e a
                    logística não são carregados no frontend nem expostos pela API.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-1 h-5 w-5 text-cyan-300" />
                <div>
                  <p className="text-sm font-medium text-white">Validação financeira</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    A diretoria aprova pagamentos das inscrições públicas e registra a baixa
                    das parcelas recebidas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/10 bg-[#08111f]/88 p-6 md:p-8"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Credenciais da diretoria
            </p>
            <h2 className="mt-2 font-title text-2xl text-white">Entrar no painel interno</h2>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                E-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-surface w-full"
                placeholder="diretoria@retiro.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Senha
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-surface w-full"
                placeholder="Digite sua senha"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-6 rounded-[20px] border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-slate-400">
              Use apenas credenciais cadastradas na tabela
              <span className="text-white"> `diretoria_usuarios`</span>.
            </p>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Entrando...' : 'Acessar painel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
