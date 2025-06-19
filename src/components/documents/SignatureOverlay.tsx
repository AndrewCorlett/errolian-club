import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { Document } from '@/types/documents'
import { useUserStore } from '@/store/userStore'
import { canSign } from '@/utils/documentPermissions'

interface SignatureField {
  id: string
  x: number // percentage
  y: number // percentage
  width: number // percentage
  height: number // percentage
  signedBy?: string
  signatureData?: string
  required: boolean
}

interface SignatureOverlayProps {
  document: Document
  isEditing?: boolean
  onFieldsChange?: (fields: SignatureField[]) => void
  onSign?: (fieldId: string, signatureData: string) => void
  className?: string
}

export default function SignatureOverlay({ 
  document, 
  isEditing = false, 
  onFieldsChange, 
  onSign,
  className = '' 
}: SignatureOverlayProps) {
  const { currentUser } = useUserStore()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [fields, setFields] = useState<SignatureField[]>([])
  const [isPlacing, setIsPlacing] = useState(false)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [showSigningModal, setShowSigningModal] = useState(false)
  const [currentSigningField, setCurrentSigningField] = useState<string | null>(null)
  const [signatureText, setSignatureText] = useState('')

  // Initialize fields from document signatures
  useEffect(() => {
    if (document.signatures.length > 0) {
      const signatureFields = document.signatures.map((sig, index) => ({
        id: sig.id,
        x: 20 + (index * 25), // Default positioning
        y: 80 + (index * 10),
        width: 20,
        height: 8,
        signedBy: sig.userId,
        signatureData: sig.signatureData,
        required: true
      }))
      setFields(signatureFields)
    }
  }, [document.signatures])

  // Handle clicking on the overlay to place signature fields
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isPlacing || !overlayRef.current) return

    const rect = overlayRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newField: SignatureField = {
      id: `field-${Date.now()}`,
      x: Math.max(0, Math.min(80, x)), // Keep within bounds
      y: Math.max(0, Math.min(90, y)),
      width: 20,
      height: 8,
      required: true
    }

    const updatedFields = [...fields, newField]
    setFields(updatedFields)
    onFieldsChange?.(updatedFields)
    setIsPlacing(false)
  }

  const handleFieldClick = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isEditing) {
      setSelectedField(fieldId)
    } else {
      // Check if user can sign this field
      const field = fields.find(f => f.id === fieldId)
      if (field && !field.signedBy && currentUser && canSign(currentUser.role)) {
        setCurrentSigningField(fieldId)
        setShowSigningModal(true)
      }
    }
  }

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter(f => f.id !== fieldId)
    setFields(updatedFields)
    onFieldsChange?.(updatedFields)
    setSelectedField(null)
  }

  const handleSignField = () => {
    if (!currentSigningField || !signatureText.trim() || !currentUser) return

    const signatureData = `data:text/plain;base64,${btoa(signatureText.trim())}`
    
    const updatedFields = fields.map(field => 
      field.id === currentSigningField 
        ? { ...field, signedBy: currentUser.id, signatureData }
        : field
    )
    
    setFields(updatedFields)
    onSign?.(currentSigningField, signatureData)
    setShowSigningModal(false)
    setCurrentSigningField(null)
    setSignatureText('')
  }

  const getSignatureProgress = () => {
    const signedFields = fields.filter(f => f.signedBy).length
    const totalFields = fields.length
    return totalFields > 0 ? (signedFields / totalFields) * 100 : 0
  }

  const canUserSign = currentUser && canSign(currentUser.role)

  return (
    <div className={`relative ${className}`}>
      {/* Editing Controls */}
      {isEditing && (
        <div className="absolute top-2 left-2 z-20 bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlacing ? "default" : "outline"}
              onClick={() => setIsPlacing(!isPlacing)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {isPlacing ? 'Click to Place' : 'Add Field'}
            </Button>
            
            {selectedField && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteField(selectedField)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Delete Field
              </Button>
            )}
          </div>
          
          {isPlacing && (
            <p className="text-xs text-gray-600 mt-2">
              Click on the document to place a signature field
            </p>
          )}
        </div>
      )}

      {/* Signature Progress */}
      {!isEditing && fields.length > 0 && (
        <div className="absolute top-2 right-2 z-20 bg-white rounded-lg shadow-lg p-3 border min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Signature Progress</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getSignatureProgress()}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-600">
            {fields.filter(f => f.signedBy).length} of {fields.length} signatures collected
          </p>
        </div>
      )}

      {/* Signature Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 z-10"
        onClick={handleOverlayClick}
        style={{ cursor: isPlacing ? 'crosshair' : 'default' }}
      >
        {fields.map(field => (
          <div
            key={field.id}
            className={`absolute border-2 transition-all duration-200 ${
              field.signedBy 
                ? 'border-green-500 bg-green-50' 
                : selectedField === field.id
                  ? 'border-blue-500 bg-blue-50'
                  : canUserSign && !field.signedBy
                    ? 'border-purple-400 bg-purple-50 hover:border-purple-600 cursor-pointer'
                    : 'border-gray-400 bg-gray-50'
            }`}
            style={{
              left: `${field.x}%`,
              top: `${field.y}%`,
              width: `${field.width}%`,
              height: `${field.height}%`,
            }}
            onClick={(e) => handleFieldClick(field.id, e)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {field.signedBy ? (
                <div className="text-center">
                  <svg className="w-4 h-4 text-green-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-green-800 font-medium">Signed</span>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-4 h-4 text-purple-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="text-xs text-purple-800 font-medium">
                    {canUserSign ? 'Click to Sign' : 'Signature Required'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Resize handles for editing mode */}
            {isEditing && selectedField === field.id && (
              <>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize" />
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize" />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Signing Modal */}
      {showSigningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sign Document</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Signature
                  </label>
                  <input
                    type="text"
                    placeholder="Type your full name"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be recorded as your digital signature
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    By signing this document, you acknowledge that you have read and agree to its contents.
                    Your signature will be recorded with a timestamp and IP address for legal purposes.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSigningModal(false)
                    setCurrentSigningField(null)
                    setSignatureText('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSignField}
                  disabled={!signatureText.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Sign Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}