import { useLocation, Link } from 'react-router-dom'
import Logo from '@/components/ui/Logo'

const navItems = [
  { name: 'Home', href: '/', icon: 'home' },
  { name: 'Calendar', href: '/calendar', icon: 'calendar' },
  { name: 'Split-Pay', href: '/split-pay', icon: 'credit-card' },
  { name: 'Documents', href: '/docs', icon: 'file-text' },
  { name: 'Account', href: '/account', icon: 'user' },
]

const IconComponent = ({ icon, isActive }: { icon: string; isActive: boolean }) => {
  const icons = {
    home: (
      <svg className={`w-6 h-6 transition-all-smooth ${isActive ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline strokeLinecap="round" strokeLinejoin="round" points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    calendar: (
      <svg className={`w-6 h-6 transition-all-smooth ${isActive ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <rect strokeLinecap="round" strokeLinejoin="round" x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="16" y1="2" x2="16" y2="6" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="8" y1="2" x2="8" y2="6" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    'credit-card': (
      <svg className={`w-6 h-6 transition-all-smooth ${isActive ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <rect strokeLinecap="round" strokeLinejoin="round" x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    'file-text': (
      <svg className={`w-6 h-6 transition-all-smooth ${isActive ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline strokeLinecap="round" strokeLinejoin="round" points="14,2 14,8 20,8" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="16" y1="13" x2="8" y2="13" />
        <line strokeLinecap="round" strokeLinejoin="round" x1="16" y1="17" x2="8" y2="17" />
        <polyline strokeLinecap="round" strokeLinejoin="round" points="10,9 9,9 8,9" />
      </svg>
    ),
    user: (
      <svg className={`w-6 h-6 transition-all-smooth ${isActive ? 'scale-110' : ''}`} viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle strokeLinecap="round" strokeLinejoin="round" cx="12" cy="7" r="4" />
      </svg>
    )
  }
  
  return icons[icon as keyof typeof icons] || icons.home
}

export default function SidebarNavigation() {
  const location = useLocation()

  return (
    <div className="hidden desktop:flex desktop:flex-col desktop:fixed desktop:left-0 desktop:top-0 desktop:h-full desktop:w-64 desktop:bg-white/95 desktop:backdrop-blur-xl desktop:border-r desktop:border-primary-200/50 desktop:z-40">
      {/* Logo/Header */}
      <div className="flex items-center gap-3 p-6 border-b border-primary-200/50">
        <Logo size="md" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-primary-900 leading-tight">
            Errolian Club
          </h1>
          <p className="text-xs text-royal-600 leading-tight">
            Members Portal
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all-smooth hover-lift stagger-item ${
                  isActive 
                    ? 'bg-royal-50 text-royal-600 border border-royal-200' 
                    : 'text-primary-600 hover:text-primary-900 hover:bg-primary-50'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <IconComponent icon={item.icon} isActive={isActive} />
                <span className="font-medium">
                  {item.name}
                </span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-royal-600 rounded-full animate-scale-in" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer/User Info */}
      <div className="p-4 border-t border-primary-200/50">
        <div className="text-center">
          <p className="text-xs text-primary-500">
            © 2024 Errolian Club
          </p>
          <p className="text-xs text-primary-400">
            All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}