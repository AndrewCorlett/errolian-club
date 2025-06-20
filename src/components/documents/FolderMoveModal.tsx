import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import type { DocumentFolder } from '@/types/documents'

interface FolderMoveModalProps {
  folder: DocumentFolder
  currentParentId: string | null | undefined
  availableFolders: DocumentFolder[]
  onClose: () => void
  onMove: (targetFolderId: string | null) => void
}

export default function FolderMoveModal({
  folder,
  currentParentId,
  availableFolders,
  onClose,
  onMove
}: FolderMoveModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentParentId || null)

  const handleMove = () => {
    if (selectedFolderId !== currentParentId) {
      onMove(selectedFolderId)
    }
    onClose()
  }

  // Build folder tree structure
  const buildFolderTree = (folders: DocumentFolder[], parentId: string | null = null, level = 0): React.ReactElement[] => {
    return folders
      .filter(f => f.parentId === parentId)
      .map(folder => (
        <div key={folder.id}>
          <div className="flex items-center">
            <RadioGroupItem value={folder.id} id={folder.id} className="mr-2" />
            <Label 
              htmlFor={folder.id} 
              className="cursor-pointer flex-1 py-2"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {folder.icon || '📁'} {folder.name}
            </Label>
          </div>
          {buildFolderTree(folders, folder.id, level + 1)}
        </div>
      ))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{folder.name}"</DialogTitle>
          <DialogDescription>
            Select the destination folder for this item.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Select the destination folder:
          </p>
          
          <RadioGroup value={selectedFolderId || 'root'} onValueChange={(value) => setSelectedFolderId(value === 'root' ? null : value)}>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              <div className="flex items-center">
                <RadioGroupItem value="root" id="root" className="mr-2" />
                <Label htmlFor="root" className="cursor-pointer flex-1 py-2">
                  📁 Root (Top level)
                </Label>
              </div>
              {buildFolderTree(availableFolders)}
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove}
            disabled={selectedFolderId === currentParentId}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}