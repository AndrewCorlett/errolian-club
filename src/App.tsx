import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import BottomNavigation from './components/layout/BottomNavigation'

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
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <Home />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <Home />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/calendar" element={
              <ProtectedRoute>
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <Calendar />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/split-pay" element={
              <ProtectedRoute>
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <SplitPay />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/split-pay/new-expense" element={
              <ProtectedRoute>
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <SplitPay />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/split-pay/event/:eventId" element={
              <ProtectedRoute>
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <SplitPayEventDetails />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/docs" element={
              <ProtectedRoute requirePermission="canUploadDocuments">
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <Documents />
                  </main>
                  <BottomNavigation />
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/account" element={
              <ProtectedRoute>
                <div>
                  <main className="pb-20 safe-area-bottom">
                    <Account />
                  </main>
                  <BottomNavigation />
                </div>
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