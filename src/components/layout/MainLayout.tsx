import { type ReactNode } from 'react'
import BottomNavigation from './BottomNavigation'
import SidebarNavigation from './SidebarNavigation'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(225, 220, 200)' }}>
      {/* Desktop Sidebar */}
      <SidebarNavigation />
      
      {/* Main Content */}
      <main className="pb-20 safe-area-bottom desktop:pb-0 desktop:pl-64">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}