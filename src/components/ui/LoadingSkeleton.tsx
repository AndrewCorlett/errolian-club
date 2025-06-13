import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'card' | 'text' | 'circle' | 'rectangle'
  lines?: number
}

export default function LoadingSkeleton({ 
  className, 
  variant = 'text', 
  lines = 1 
}: LoadingSkeletonProps) {
  const baseClasses = "loading-shimmer rounded animate-pulse"
  
  if (variant === 'card') {
    return (
      <div className={cn("p-6 bg-white rounded-xl border border-gray-200", className)}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'circle') {
    return (
      <div className={cn(baseClasses, "rounded-full bg-gray-200", className)} />
    )
  }

  if (variant === 'rectangle') {
    return (
      <div className={cn(baseClasses, "bg-gray-200", className)} />
    )
  }

  // Text variant
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            baseClasses, 
            "h-4 bg-gray-200",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  )
}