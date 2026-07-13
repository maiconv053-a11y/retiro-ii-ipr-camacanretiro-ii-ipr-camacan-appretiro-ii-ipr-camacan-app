import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const initialized = useAuthStore((state) => state.initialized)
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    if (!initialized && !loading) {
      void initialize()
    }
  }, [initialize, initialized, loading])

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020611] px-4 text-slate-100">
        <div className="rounded-[24px] border border-white/10 bg-[#08111d]/88 px-6 py-5 text-center">
          <p className="font-title text-sm uppercase tracking-[0.24em] text-cyan-300/60">
            Diretoria
          </p>
          <p className="mt-3 text-sm text-slate-300">Validando sessão protegida...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/diretoria/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
