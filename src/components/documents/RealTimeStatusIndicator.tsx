import { Wifi, WifiOff, AlertCircle, RotateCcw, Loader2 } from 'lucide-react'

interface RealTimeStatusIndicatorProps {
  isConnected: boolean
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'recovering'
  isRecovering?: boolean
  onManualReconnect?: () => void
  className?: string
}

export default function RealTimeStatusIndicator({ 
  connectionStatus = 'connecting',
  onManualReconnect,
  className = '' 
}: RealTimeStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4 text-green-500" />,
          text: 'Documents loaded',
          textColor: 'text-green-700 dark:text-green-400'
        }
      
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
          text: 'Connecting...',
          textColor: 'text-blue-700 dark:text-blue-400'
        }
      
      case 'recovering':
        return {
          icon: <RotateCcw className="h-4 w-4 text-amber-500 animate-spin" />,
          text: 'Reconnecting...',
          textColor: 'text-amber-700 dark:text-amber-400'
        }
      
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4 text-red-500" />,
          text: 'Disconnected',
          textColor: 'text-red-700 dark:text-red-400'
        }
      
      default:
        return {
          icon: <WifiOff className="h-4 w-4 text-gray-500" />,
          text: 'Unknown status',
          textColor: 'text-gray-700 dark:text-gray-400'
        }
    }
  }

  const { icon, text, textColor } = getStatusDisplay()

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {icon}
      <span className={textColor}>
        {text}
      </span>
      {connectionStatus === 'disconnected' && onManualReconnect && (
        <button
          onClick={onManualReconnect}
          className="text-xs underline hover:no-underline text-blue-600 dark:text-blue-400 ml-1"
          title="Try to reconnect"
        >
          Retry
        </button>
      )}
    </div>
  )
}

interface ConnectionErrorIndicatorProps {
  onRetry?: () => void
}

export function ConnectionErrorIndicator({ onRetry }: ConnectionErrorIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
      <AlertCircle className="h-4 w-4" />
      <span>Connection lost</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}