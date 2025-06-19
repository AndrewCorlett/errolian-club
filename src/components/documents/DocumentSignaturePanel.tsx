import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Document } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'

interface DocumentSignaturePanelProps {
  document: Document
  onSignDocument: (signatureData: string) => void
  onRemoveSignature: (signatureId: string) => void
}

interface SignatureDrawingProps {
  onSignature: (dataUrl: string) => void
  onClear: () => void
}

// Signature drawing component
function SignatureDrawing({ onSignature, onClear }: SignatureDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    if (canvas && rect) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    if (canvas && rect) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
        ctx.stroke()
        setHasSignature(true)
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasSignature(false)
        onClear()
      }
    }
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png')
      onSignature(dataUrl)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-32 border border-gray-200 rounded cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <p className="text-xs text-gray-500 text-center mt-2">
          Draw your signature above
        </p>
      </div>
      
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={clearSignature}
          variant="outline"
          size="sm"
          disabled={!hasSignature}
        >
          Clear
        </Button>
        <Button
          type="button"
          onClick={saveSignature}
          disabled={!hasSignature}
          size="sm"
        >
          Save Signature
        </Button>
      </div>
    </div>
  )
}

// Mock function to get user by ID
const getUserById = (userId: string) => {
  const users = {
    'user_1': { id: 'user_1', name: 'John Smith', role: 'Commodore' },
    'user_2': { id: 'user_2', name: 'Sarah Johnson', role: 'Vice Commodore' },
    'user_3': { id: 'user_3', name: 'Mike Wilson', role: 'Secretary' },
    'user_4': { id: 'user_4', name: 'Lisa Brown', role: 'Treasurer' },
    'user_5': { id: 'user_5', name: 'David Jones', role: 'Race Officer' },
  }
  return users[userId as keyof typeof users] || { 
    id: userId, 
    name: 'Unknown User', 
    role: 'Member' 
  }
}

export default function DocumentSignaturePanel({
  document,
  onSignDocument,
  onRemoveSignature
}: DocumentSignaturePanelProps) {
  const { profile } = useAuth()
  const [showSigningInterface, setShowSigningInterface] = useState(false)
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw')
  const [typedSignature, setTypedSignature] = useState('')

  if (!document.requiresSignatures) {
    return null
  }

  const userHasSigned = document.signatures.some(sig => sig.userId === profile?.id)
  const canSign = profile && ['super-admin', 'commodore', 'officer'].includes(profile.role)
  const allSignersCount = document.signatures.length
  const isComplete = document.signatures.length > 0 // In a real app, this would check against required signers

  const handleDrawnSignature = (dataUrl: string) => {
    onSignDocument(dataUrl)
    setShowSigningInterface(false)
  }

  const handleTypedSignature = () => {
    if (typedSignature.trim()) {
      // Convert typed signature to a simple image
      const canvas = window.document.createElement('canvas')
      canvas.width = 300
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#1f2937'
        ctx.font = '24px cursive'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2)
        
        const dataUrl = canvas.toDataURL('image/png')
        onSignDocument(dataUrl)
        setShowSigningInterface(false)
        setTypedSignature('')
      }
    }
  }

  const getSignatureStatusColor = () => {
    if (isComplete) return 'text-green-600 bg-green-50 border-green-200'
    if (allSignersCount > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getSignatureStatusText = () => {
    if (isComplete) return '✓ All signatures collected'
    if (allSignersCount > 0) return `${allSignersCount} signature${allSignersCount !== 1 ? 's' : ''} collected`
    return 'No signatures yet'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Digital Signatures</CardTitle>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getSignatureStatusColor()}`}>
            {getSignatureStatusText()}
          </div>
        </div>
        {document.signatureDeadline && (
          <p className="text-sm text-gray-600">
            Deadline: {format(document.signatureDeadline, 'MMMM d, yyyy h:mm a')}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Signature Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Signature Progress</span>
            <span>{allSignersCount} collected</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.max((allSignersCount / Math.max(allSignersCount, 3)) * 100, 0)}%` }}
            />
          </div>
        </div>

        {/* Existing Signatures */}
        {document.signatures.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Signatures</h4>
            <div className="space-y-3">
              {document.signatures.map((signature) => {
                const signer = getUserById(signature.userId)
                return (
                  <div
                    key={signature.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                        {signature.signatureData ? (
                          <img
                            src={signature.signatureData}
                            alt="Signature"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">Sig</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {signer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {signer.role} • Signed {format(signature.signedAt, 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                    
                    {signature.userId === profile?.id && (
                      <Button
                        onClick={() => onRemoveSignature(signature.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Signing Interface */}
        {canSign && !userHasSigned && (
          <div>
            {!showSigningInterface ? (
              <Button
                onClick={() => setShowSigningInterface(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add My Signature
              </Button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Add Your Signature</h4>
                  <Button
                    onClick={() => setShowSigningInterface(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Signature Type Toggle */}
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={() => setSignatureType('draw')}
                    variant={signatureType === 'draw' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Draw
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSignatureType('type')}
                    variant={signatureType === 'type' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Type
                  </Button>
                </div>

                {/* Signature Input */}
                {signatureType === 'draw' ? (
                  <SignatureDrawing
                    onSignature={handleDrawnSignature}
                    onClear={() => {}}
                  />
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      style={{ fontFamily: 'cursive', fontSize: '18px' }}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleTypedSignature}
                        disabled={!typedSignature.trim()}
                      >
                        Save Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Already Signed */}
        {userHasSigned && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-green-800 font-medium">✓ You have already signed this document</div>
            <div className="text-green-600 text-sm mt-1">
              Signed on {format(
                document.signatures.find(sig => sig.userId === profile?.id)?.signedAt || new Date(),
                'MMMM d, yyyy h:mm a'
              )}
            </div>
          </div>
        )}

        {/* Cannot Sign */}
        {!canSign && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-gray-600 font-medium">Signature not required</div>
            <div className="text-gray-500 text-sm mt-1">
              Only officers can sign this document
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}