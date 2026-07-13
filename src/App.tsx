import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import DirectorLoginPage from '@/pages/DirectorLoginPage'
import FinancialPage from '@/pages/FinancialPage'
import LogisticsPage from '@/pages/LogisticsPage'
import ParticipantsPage from '@/pages/ParticipantsPage'
import PublicRegistrationPage from '@/pages/PublicRegistrationPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRegistrationPage />} />
        <Route path="/diretoria/login" element={<DirectorLoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/diretoria" element={<DashboardPage />} />
            <Route path="/diretoria/participantes" element={<ParticipantsPage />} />
            <Route path="/diretoria/financeiro" element={<FinancialPage />} />
            <Route path="/diretoria/logistica" element={<LogisticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
