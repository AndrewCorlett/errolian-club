import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary'
}

export default function FloatingActionButton({ 
  href, 
  onClick, 
  icon, 
  className,
  variant = 'primary'
}: FloatingActionButtonProps) {
  const baseClasses = "fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all-smooth active:scale-95 z-40 flex items-center justify-center text-white font-semibold hover:-translate-y-1"
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
    secondary: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
  }

  const combinedClasses = cn(baseClasses, variantClasses[variant], className)

  if (href) {
    return (
      <Link to={href} className={combinedClasses}>
        {icon}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={combinedClasses}>
      {icon}
    </button>
  )
}