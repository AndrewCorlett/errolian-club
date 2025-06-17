import React, { useState, useEffect } from 'react'
import { useUserStore } from '@/store/userStore'

interface FixedHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export default function FixedHeader({ title, subtitle, children, className = '' }: FixedHeaderProps) {
  const { currentUser } = useUserStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Determine if we should show minimized header
      if (currentScrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${className}`}>
      <div className={`bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
        isScrolled ? 'py-2 shadow-lg' : 'py-4 shadow-sm'
      }`}>
        <div className="px-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className={`transition-all duration-300 ${isScrolled ? 'scale-90' : 'scale-100'}`}>
              <h1 className={`font-bold text-gray-900 transition-all duration-300 ${
                isScrolled ? 'text-lg' : 'text-2xl'
              }`}>
                {title}
              </h1>
              {subtitle && !isScrolled && (
                <p className="text-gray-600 text-sm mt-1 transition-opacity duration-300">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {children}
              
              {/* User Avatar */}
              <div className={`transition-all duration-300 ${isScrolled ? 'scale-90' : 'scale-100'}`}>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      {currentUser?.name.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}