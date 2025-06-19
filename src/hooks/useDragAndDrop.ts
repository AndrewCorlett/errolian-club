import { useState, useRef } from 'react'
import type { Document, DocumentFolder } from '@/types/documents'

interface DragItem {
  type: 'document' | 'folder'
  id: string
  data: Document | DocumentFolder
}

interface DragState {
  isDragging: boolean
  dragItem: DragItem | null
  dragOverTarget: string | null
}

interface UseDragAndDropProps {
  onMoveDocument: (documentId: string, targetFolderId: string | null) => void
  onMoveFolder: (folderId: string, targetFolderId: string | null) => void
}

export function useDragAndDrop({ onMoveDocument, onMoveFolder }: UseDragAndDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItem: null,
    dragOverTarget: null
  })
  
  const dragCounter = useRef(0)

  const handleDragStart = (type: 'document' | 'folder', id: string, data: Document | DocumentFolder) => {
    const dragItem: DragItem = { type, id, data }
    setDragState({
      isDragging: true,
      dragItem,
      dragOverTarget: null
    })
    dragCounter.current = 0
  }

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      dragItem: null,
      dragOverTarget: null
    })
    dragCounter.current = 0
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    dragCounter.current++
    
    if (dragCounter.current === 1) {
      setDragState(prev => ({
        ...prev,
        dragOverTarget: targetId
      }))
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        dragOverTarget: null
      }))
    }
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault()
    
    if (!dragState.dragItem) return

    const { type, id } = dragState.dragItem

    // Prevent dropping folder into itself or its descendants
    if (type === 'folder' && targetFolderId === id) {
      handleDragEnd()
      return
    }

    // Prevent dropping into the same location
    if (type === 'document') {
      const document = dragState.dragItem.data as Document
      if (document.folderId === targetFolderId) {
        handleDragEnd()
        return
      }
      onMoveDocument(id, targetFolderId)
    } else if (type === 'folder') {
      const folder = dragState.dragItem.data as DocumentFolder
      if (folder.parentId === targetFolderId) {
        handleDragEnd()
        return
      }
      onMoveFolder(id, targetFolderId)
    }

    handleDragEnd()
  }

  const getDragProps = (type: 'document' | 'folder', id: string, data: Document | DocumentFolder) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', '') // Required for Firefox
      handleDragStart(type, id, data)
    },
    onDragEnd: handleDragEnd,
    style: {
      opacity: dragState.isDragging && dragState.dragItem?.id === id ? 0.5 : 1,
      cursor: 'grab'
    }
  })

  const getDropProps = (targetId: string | null, canDrop: boolean = true) => ({
    onDragOver: canDrop ? handleDragOver : undefined,
    onDragEnter: canDrop ? (e: React.DragEvent) => handleDragEnter(e, targetId || 'root') : undefined,
    onDragLeave: canDrop ? handleDragLeave : undefined,
    onDrop: canDrop ? (e: React.DragEvent) => handleDrop(e, targetId) : undefined,
    className: canDrop && dragState.dragOverTarget === (targetId || 'root') 
      ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50' 
      : ''
  })

  const isDraggedOver = (targetId: string | null) => {
    return dragState.dragOverTarget === (targetId || 'root')
  }

  const isDragging = dragState.isDragging
  const draggedItem = dragState.dragItem

  return {
    isDragging,
    draggedItem,
    getDragProps,
    getDropProps,
    isDraggedOver
  }
}