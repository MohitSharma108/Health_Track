import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import DiaryPage from '@/pages/DiaryPage'
import LogPage from '@/pages/LogPage'
import FoodDetailPage from '@/pages/FoodDetailPage'
import DraftReviewPage from '@/pages/DraftReviewPage'
import BarcodeScannerPage from '@/pages/BarcodeScannerPage'
import QuickAddPage from '@/pages/QuickAddPage'
import AiPage from '@/pages/AiPage'
import ProgressPage from '@/pages/ProgressPage'
import SettingsPage from '@/pages/SettingsPage'
import AuthPage from '@/pages/AuthPage'
import useAuthStore from '@/store/authStore'

function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore()
  const localToken = localStorage.getItem('nourish_token')

  if (!isAuthenticated && !token && !localToken) {
    return <Navigate to="/auth" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected routes within mobile app shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/diary" replace />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/log/food/:id" element={<FoodDetailPage />} />
          <Route path="/log/draft" element={<DraftReviewPage />} />
          <Route path="/log/barcode" element={<BarcodeScannerPage />} />
          <Route path="/log/quick" element={<QuickAddPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/diary" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
