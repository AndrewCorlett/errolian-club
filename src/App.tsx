import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import SplashScreen from './components/ui/SplashScreen'
import { LocationPickerDemo } from './components/places/demo/LocationPickerDemo'
import { PWAInstallPrompt } from './components/layout/PWAInstallPrompt'

// Public pages
import Login from './pages/Login'
import Register from './pages/Register'

// Protected pages
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import SplitPay from './pages/SplitPay'
import SplitPayEventDetails from './pages/SplitPayEventDetails'
import ExpenseEventDetail from './pages/ExpenseEventDetail'
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
    
    // Set a data attribute to indicate React Router is loaded
    document.documentElement.setAttribute('data-react-router-loaded', 'true')
    
    // Handle navigation type detection (for older browsers)
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const isRefresh = navigationEntries[0]?.type === 'reload' ||
                     (performance as any).navigation?.type === 1 // Legacy browsers
    
    if (isRefresh) {
      console.log('Page refresh detected, ensuring clean state')
      // Add a small delay to ensure React has mounted properly
      setTimeout(() => {
        document.documentElement.setAttribute('data-page-refreshed', 'true')
      }, 100)
    }

    // No cleanup needed
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
        <div
          className="min-h-screen safe-area-full"
          style={{ backgroundColor: 'rgb(225, 220, 200)' }}
          data-app-ready="true"
        >
          <PWAInstallPrompt />
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/test-autocomplete" element={<LocationPickerDemo />} />
            
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
            
            <Route path="/split-pay/events/:expenseEventId" element={
              <ProtectedRoute>
                <MainLayout>
                  <ExpenseEventDetail />
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