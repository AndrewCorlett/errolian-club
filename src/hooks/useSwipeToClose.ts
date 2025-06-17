import { useEffect, useRef, useState } from 'react'

interface UseSwipeToCloseOptions {
  onClose: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipeToClose({ 
  onClose, 
  threshold = 100, 
  enabled = true 
}: UseSwipeToCloseOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [startY, setStartY] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const element = elementRef.current
    let rafId: number

    const handleTouchStart = (e: TouchEvent) => {
      setStartY(e.touches[0].clientY)
      setIsDragging(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return
      
      const currentY = e.touches[0].clientY
      const deltaY = Math.max(0, currentY - startY) // Only allow downward swipes
      
      setDragY(deltaY)
      
      // Update transform with requestAnimationFrame for smooth performance
      rafId = requestAnimationFrame(() => {
        if (element) {
          element.style.transform = `translateY(${deltaY}px)`
          element.style.transition = 'none'
        }
      })
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      
      setIsDragging(false)
      
      if (dragY > threshold) {
        // Swipe threshold exceeded, close the sheet
        onClose()
      } else {
        // Reset position
        if (element) {
          element.style.transform = 'translateY(0)'
          element.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }
      }
      
      setDragY(0)
      setStartY(0)
    }

    // Handle mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      setStartY(e.clientY)
      setIsDragging(true)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const currentY = e.clientY
      const deltaY = Math.max(0, currentY - startY)
      
      setDragY(deltaY)
      
      rafId = requestAnimationFrame(() => {
        if (element) {
          element.style.transform = `translateY(${deltaY}px)`
          element.style.transition = 'none'
        }
      })
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      
      setIsDragging(false)
      
      if (dragY > threshold) {
        onClose()
      } else {
        if (element) {
          element.style.transform = 'translateY(0)'
          element.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }
      }
      
      setDragY(0)
      setStartY(0)
    }

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    // Add mouse event listeners for desktop
    element.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      
      element.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      
      element.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [enabled, isDragging, dragY, startY, threshold, onClose])

  return {
    elementRef,
    isDragging,
    dragY,
    swipeStyle: {
      transform: isDragging ? `translateY(${dragY}px)` : undefined,
      transition: isDragging ? 'none' : undefined,
    }
  }
}