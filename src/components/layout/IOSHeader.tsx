import React, { useEffect, useState } from 'react'

interface IOSHeaderProps {
  title: string
  subtitle?: string
  leftActions?: React.ReactNode[]
  rightActions?: React.ReactNode[]
  onScroll?: (scrolled: boolean) => void
  className?: string
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
          ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800' 
          : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 active:bg-gray-300/80'
        }
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
  className = ''
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
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm'
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md'
          }
          safe-area-top
          ${className}
        `}
    >
      <div className="px-4 pt-3 pb-2">
        {/* Navigation Row */}
        <div className="flex items-center justify-between mb-2 min-h-[44px]">
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
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Subtle inner shadow when scrolled */}
      {isScrolled && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
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