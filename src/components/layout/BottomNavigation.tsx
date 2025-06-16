import { useLocation, Link } from 'react-router-dom'

const navItems = [
  { name: 'Home', href: '/', icon: 'home' },
  { name: 'Calendar', href: '/calendar', icon: 'calendar' },
  { name: 'Split-Pay', href: '/split-pay', icon: 'credit-card' },
  { name: 'Docs', href: '/docs', icon: 'file-text' },
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

export default function BottomNavigation() {
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50 safe-area-bottom">
      <div className="flex justify-around px-2 py-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all-smooth relative stagger-item hover-lift ${
                isActive 
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {isActive && (
                <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/40 rounded-xl animate-scale-in" />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <IconComponent icon={item.icon} isActive={isActive} />
                <span className={`text-xs font-medium mt-0.5 transition-colors-smooth ${
                  isActive ? 'text-blue-600' : ''
                }`}>
                  {item.name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}