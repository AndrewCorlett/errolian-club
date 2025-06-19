import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DocumentFolder } from '@/types/documents'

interface FolderManagementModalProps {
  isOpen: boolean
  mode: 'create' | 'rename' | 'move'
  folder?: DocumentFolder
  parentFolder?: DocumentFolder
  availableFolders?: DocumentFolder[]
  onClose: () => void
  onConfirm: (data: FolderFormData) => void
}

export interface FolderFormData {
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
}

const FOLDER_COLORS = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
]

const FOLDER_ICONS = [
  '📁', '📂', '📋', '📊', '📈', '📉', '📝', '📄', 
  '📑', '📒', '📓', '📔', '📕', '📗', '📘', '📙'
]

export default function FolderManagementModal({
  isOpen,
  mode,
  folder,
  parentFolder,
  availableFolders = [],
  onClose,
  onConfirm
}: FolderManagementModalProps) {
  const [formData, setFormData] = useState<FolderFormData>({
    name: '',
    description: '',
    color: 'blue',
    icon: '📁',
    parentId: undefined
  })

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        color: 'blue',
        icon: '📁',
        parentId: parentFolder?.id
      })
    } else if (mode === 'rename' && folder) {
      setFormData({
        name: folder.name,
        description: folder.description || '',
        color: folder.color || 'blue',
        icon: folder.icon || '📁',
        parentId: folder.parentId
      })
    } else if (mode === 'move' && folder) {
      setFormData({
        name: folder.name,
        description: folder.description || '',
        color: folder.color || 'blue',
        icon: folder.icon || '📁',
        parentId: folder.parentId
      })
    }
  }, [mode, folder, parentFolder])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    onConfirm(formData)
    onClose()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      icon: '📁',
      parentId: undefined
    })
    onClose()
  }

  if (!isOpen) return null

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Folder'
      case 'rename': return 'Rename Folder'
      case 'move': return 'Move Folder'
      default: return 'Manage Folder'
    }
  }

  const getSubmitButtonText = () => {
    switch (mode) {
      case 'create': return 'Create Folder'
      case 'rename': return 'Save Changes'
      case 'move': return 'Move Folder'
      default: return 'Save'
    }
  }

  // Filter out the current folder and its descendants for move operation
  const getAvailableParentFolders = () => {
    if (mode !== 'move' || !folder) return availableFolders

    return availableFolders.filter(f => {
      // Can't move folder into itself or its descendants
      if (f.id === folder.id) return false
      // Add logic to check if f is a descendant of folder
      return true
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{getModalTitle()}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Folder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter folder name..."
                required
                disabled={mode === 'move'}
                className="w-full"
              />
            </div>

            {/* Description */}
            {mode !== 'move' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Parent Folder (for create and move) */}
            {(mode === 'create' || mode === 'move') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Folder
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Root Folder</option>
                  {getAvailableParentFolders().map(f => (
                    <option key={f.id} value={f.id}>
                      {f.icon} {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Icon and Color (for create and rename) */}
            {mode !== 'move' && (
              <>
                {/* Folder Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {FOLDER_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-2 text-xl border-2 rounded-md hover:bg-gray-50 transition-colors ${
                          formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Folder Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FOLDER_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`p-3 rounded-md border-2 flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                          formData.color === color.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${color.class}`} />
                        <span className="text-sm">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {getSubmitButtonText()}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}