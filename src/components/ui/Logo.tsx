interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'light' | 'dark'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

export default function Logo({ 
  size = 'md', 
  className = '',
  variant = 'light'
}: LogoProps) {
  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img 
        src="/logo.png" 
        alt="Errolian Club"
        className={`w-full h-full object-contain ${
          variant === 'dark' ? 'invert' : ''
        }`}
      />
    </div>
  )
}