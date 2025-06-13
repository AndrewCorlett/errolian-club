import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import BottomNavigation from './components/layout/BottomNavigation'
import Home from './pages/Home'
import Calendar from './pages/Calendar'
import SplitPay from './pages/SplitPay'
import SplitPayEventDetails from './pages/SplitPayEventDetails'
import Documents from './pages/Documents'
import Account from './pages/Account'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/split-pay" element={<SplitPay />} />
            <Route path="/split-pay/event/:eventId" element={<SplitPayEventDetails />} />
            <Route path="/docs" element={<Documents />} />
            <Route path="/account" element={<Account />} />
          </Routes>
        </main>
        <BottomNavigation />
      </div>
    </Router>
  )
}

export default App