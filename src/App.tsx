import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import FinancialPage from '@/pages/FinancialPage'
import LogisticsPage from '@/pages/LogisticsPage'
import ParticipantsPage from '@/pages/ParticipantsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/participantes" element={<ParticipantsPage />} />
          <Route path="/financeiro" element={<FinancialPage />} />
          <Route path="/logistica" element={<LogisticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
