import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import SplashScreen from './components/ui/SplashScreen'

// Public pages
import Login from './pages/Login'
import Register from './pages/Register'

// Protected pages
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import SplitPay from './pages/SplitPay'
import SplitPayEventDetails from './pages/SplitPayEventDetails'
import Documents from './pages/Documents'
import Account from './pages/Account'

function App() {
  const [showSplashScreen, setShowSplashScreen] = useState(() => {
    // Show splash screen if this is a PWA install or first load
    return window.matchMedia('(display-mode: standalone)').matches || 
           !sessionStorage.getItem('app-loaded')
  })

  useEffect(() => {
    // Mark app as loaded in session storage
    sessionStorage.setItem('app-loaded', 'true')
  }, [])

  const handleSplashComplete = () => {
    setShowSplashScreen(false)
  }

  if (showSplashScreen) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-200">
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout>
                  <Home />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/calendar" element={
              <ProtectedRoute>
                <MainLayout>
                  <Calendar />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/split-pay" element={
              <ProtectedRoute>
                <MainLayout>
                  <SplitPay />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/split-pay/new-expense" element={
              <ProtectedRoute>
                <MainLayout>
                  <SplitPay />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/split-pay/event/:eventId" element={
              <ProtectedRoute>
                <MainLayout>
                  <SplitPayEventDetails />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/docs" element={
              <ProtectedRoute requirePermission="canUploadDocuments">
                <MainLayout>
                  <Documents />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/account" element={
              <ProtectedRoute>
                <MainLayout>
                  <Account />
                </MainLayout>
              </ProtectedRoute>
            } />

            {/* Redirect root to dashboard for authenticated users */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App