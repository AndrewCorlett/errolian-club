import React, { useEffect, useState } from 'react'

interface IOSHeaderProps {
  title: string
  subtitle?: string
  leftActions?: React.ReactNode[]
  rightActions?: React.ReactNode[]
  onScroll?: (scrolled: boolean) => void
  className?: string
  showDayHeaders?: boolean
}

interface IOSActionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  'aria-label'?: string
  variant?: 'primary' | 'secondary'
}

export function IOSActionButton({ 
  children, 
  onClick, 
  'aria-label': ariaLabel,
  variant = 'secondary'
}: IOSActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 
        ${variant === 'primary' 
          ? 'bg-royal-600 text-white hover:bg-royal-700 active:bg-royal-800' 
          : 'bg-primary-100/80 text-primary-700 hover:bg-primary-200/80 active:bg-primary-300/80'
        }
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-royal-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
      `}
    >
      {children}
    </button>
  )
}

export default function IOSHeader({ 
  title, 
  subtitle, 
  leftActions = [], 
  rightActions = [],
  onScroll,
  className = '',
  showDayHeaders = false
}: IOSHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10
      setIsScrolled(scrolled)
      onScroll?.(scrolled)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [onScroll])

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-primary-200/50 shadow-sm' 
          : 'bg-white/80 backdrop-blur-md'
        }
        safe-area-top
        ${className}
      `}
    >
      <div className="px-4 pt-2 pb-1">
        {/* Navigation Row */}
        <div className="flex items-center justify-between mb-1 min-h-[40px]">
          {/* Left Actions */}
          <div className="flex items-center gap-2">
            {leftActions.map((action, index) => (
              <div key={index}>{action}</div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {rightActions.map((action, index) => (
              <div key={index}>{action}</div>
            ))}
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-1">
          <h1 className="text-xl font-bold text-primary-900 leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-primary-600 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Subtle inner shadow when scrolled */}
      {isScrolled && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
      )}
    </header>
  )
}

// Utility hook for managing header scroll state
export function useIOSHeaderScroll() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return isScrolled
}