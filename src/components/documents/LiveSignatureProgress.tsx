import { useState } from 'react'
import { CheckCircle, Clock, Users, AlertCircle } from 'lucide-react'
import type { Document, DocumentSignature } from '../../types/documents'
import { useDocumentRealTime } from '../../hooks/useDocumentRealTime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Simple progress component since we don't have the UI component
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full ${className}`}>
    <div 
      className="bg-blue-600 h-full rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
)

// Simple badge component since we don't have the UI component
const Badge = ({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive';
  className?: string;
}) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
    variant === 'default' ? 'bg-blue-100 text-blue-800' :
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
    'bg-red-100 text-red-800'
  } ${className}`}>
    {children}
  </span>
)

interface LiveSignatureProgressProps {
  document: Document
  requiredSigners?: string[] // Array of user IDs who need to sign
  onSignatureUpdate?: (signatures: DocumentSignature[]) => void
}

export default function LiveSignatureProgress({ 
  document, 
  requiredSigners = [],
  onSignatureUpdate 
}: LiveSignatureProgressProps) {
  const [signatures, setSignatures] = useState<DocumentSignature[]>(document.signatures || [])
  const [animatingSignature, setAnimatingSignature] = useState<string | null>(null)

  // Real-time signature updates
  useDocumentRealTime({
    onSignatureUpdate: (newSignature) => {
      if (newSignature.documentId === document.id) {
        setSignatures(prev => {
          // Prevent duplicates
          const exists = prev.some(sig => sig.id === newSignature.id)
          if (exists) return prev
          
          const updated = [...prev, newSignature]
          onSignatureUpdate?.(updated)
          
          // Trigger animation
          setAnimatingSignature(newSignature.id)
          setTimeout(() => setAnimatingSignature(null), 2000)
          
          return updated
        })
      }
    }
  })

  const totalRequired = requiredSigners.length
  const currentSigned = signatures.length
  const progressPercentage = totalRequired > 0 ? (currentSigned / totalRequired) * 100 : 0
  const isComplete = currentSigned >= totalRequired && totalRequired > 0

  // Check if signature deadline is approaching
  const isDeadlineApproaching = document.signatureDeadline && 
    new Date(document.signatureDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000 // 24 hours

  const getStatusColor = () => {
    if (isComplete) return 'text-green-600'
    if (isDeadlineApproaching) return 'text-amber-600'
    return 'text-blue-600'
  }

  const getStatusIcon = () => {
    if (isComplete) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (isDeadlineApproaching) return <AlertCircle className="h-5 w-5 text-amber-500" />
    return <Clock className="h-5 w-5 text-blue-500" />
  }

  if (!document.requiresSignatures) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className={getStatusColor()}>
            Signature Progress
          </span>
          <Badge variant={isComplete ? 'default' : 'secondary'} className="ml-auto">
            {currentSigned}/{totalRequired}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{currentSigned} signed</span>
            <span>{totalRequired - currentSigned} remaining</span>
          </div>
        </div>

        {/* Deadline Warning */}
        {isDeadlineApproaching && !isComplete && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-700">
              Deadline approaching: {document.signatureDeadline?.toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Recent Signatures */}
        {signatures.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Signatures
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {signatures
                .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())
                .slice(0, 5)
                .map((signature) => (
                  <div 
                    key={signature.id}
                    className={`flex items-center justify-between p-2 rounded-md text-sm transition-all duration-500 ${
                      animatingSignature === signature.id 
                        ? 'bg-green-100 border border-green-300 shadow-md' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="font-medium">User {signature.userId}</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(new Date(signature.signedAt))}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Completion Status */}
        {isComplete && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700">
                All signatures collected!
              </p>
              <p className="text-xs text-green-600">
                Document is now ready for final approval
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}