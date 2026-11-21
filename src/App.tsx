import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { AppLayout } from '@/components/AppLayout'
import { ToastViewport } from '@/components/ui/ToastProvider'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { JournalPage } from '@/pages/JournalPage'
import { LedgerPage } from '@/pages/LedgerPage'
import { TrialBalancePage } from '@/pages/TrialBalancePage'
import { ChartPage } from '@/pages/ChartPage'
import { useBooks } from '@/store/useBooks'

export function App() {
  const theme = useBooks((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="journal/:book" element={<JournalPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="trial-balance" element={<TrialBalancePage />} />
          <Route path="chart" element={<ChartPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
    </HashRouter>
  )
}
