import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onClick?: () => void
  threshold?: number
}

export const useLongPress = ({ onLongPress, onClick, threshold = 500 }: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  const start = useCallback(() => {
    isLongPress.current = false
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, threshold)
  }, [onLongPress, threshold])

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!isLongPress.current && onClick) {
      onClick()
    }
  }, [onClick])

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick
  }
}