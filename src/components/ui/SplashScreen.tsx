import { useEffect, useState } from 'react'
import Logo from './Logo'

interface SplashScreenProps {
  onComplete: () => void
  minDuration?: number
}

export default function SplashScreen({ onComplete, minDuration = 2000 }: SplashScreenProps) {
  const [isReady, setIsReady] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Simulate app loading
    const loadingTimer = setTimeout(() => {
      setIsReady(true)
    }, minDuration)

    return () => clearTimeout(loadingTimer)
  }, [minDuration])

  useEffect(() => {
    if (isReady) {
      // Start fade-out animation
      const fadeTimer = setTimeout(() => {
        setIsVisible(false)
        // Complete after fade animation finishes
        setTimeout(onComplete, 500)
      }, 500)

      return () => clearTimeout(fadeTimer)
    }
  }, [isReady, onComplete])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-[99999] bg-gradient-to-br from-royal-50 via-primary-50 to-accent-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
      isReady ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Logo with animation */}
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        <div className="animate-bounce-in">
          <Logo size="xl" className="!w-32 !h-32" />
        </div>
        
        {/* Club name */}
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h1 className="text-4xl font-bold text-primary-900 tracking-tight">
            Errolian Club
          </h1>
          <p className="text-lg text-royal-600">
            Your Adventure Awaits
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex flex-col items-center space-y-4 animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-royal-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-accent-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-forest-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-sm text-primary-600">
            Loading your portal...
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-royal-200 rounded-full opacity-20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-accent-200 rounded-full opacity-20 animate-ping" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-forest-200 rounded-full opacity-20 animate-ping" style={{ animationDelay: '1.5s' }}></div>
    </div>
  )
}