import { useRef, useEffect, useState } from 'react'

interface UseDragToDismissOptions {
  onDismiss: () => void
  dismissThreshold?: number // Percentage of viewport height to trigger dismiss
}

export function useDragToDismiss({
  onDismiss,
  dismissThreshold = 20
}: UseDragToDismissOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [translateY, setTranslateY] = useState(0)

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setCurrentY(touch.clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - startY
    
    // Only allow downward dragging
    if (deltaY > 0) {
      setCurrentY(touch.clientY)
      setTranslateY(deltaY)
      
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${deltaY}px)`
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaY = currentY - startY
    const viewportHeight = window.innerHeight
    const dragPercentage = (deltaY / viewportHeight) * 100
    
    if (dragPercentage >= dismissThreshold) {
      // Dismiss the modal
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(100vh)`
        containerRef.current.style.transition = 'transform 0.3s ease-out'
        
        setTimeout(() => {
          onDismiss()
        }, 300)
      }
    } else {
      // Snap back to original position
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateY(0)'
        containerRef.current.style.transition = 'transform 0.3s ease-out'
        
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transition = ''
          }
        }, 300)
      }
    }
    
    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
    setTranslateY(0)
  }

  const handleMouseDown = (e: MouseEvent) => {
    setStartY(e.clientY)
    setCurrentY(e.clientY)
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const deltaY = e.clientY - startY
    
    // Only allow downward dragging
    if (deltaY > 0) {
      setCurrentY(e.clientY)
      setTranslateY(deltaY)
      
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${deltaY}px)`
      }
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    
    const deltaY = currentY - startY
    const viewportHeight = window.innerHeight
    const dragPercentage = (deltaY / viewportHeight) * 100
    
    if (dragPercentage >= dismissThreshold) {
      // Dismiss the modal
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(100vh)`
        containerRef.current.style.transition = 'transform 0.3s ease-out'
        
        setTimeout(() => {
          onDismiss()
        }, 300)
      }
    } else {
      // Snap back to original position
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateY(0)'
        containerRef.current.style.transition = 'transform 0.3s ease-out'
        
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.transition = ''
          }
        }, 300)
      }
    }
    
    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
    setTranslateY(0)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Add touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Add mouse events for desktop
    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, startY, currentY])

  return {
    containerRef,
    isDragging,
    translateY
  }
}