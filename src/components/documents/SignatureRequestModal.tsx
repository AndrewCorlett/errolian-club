import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import type { Document } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'

interface SignatureRequestModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (request: SignatureRequest) => void
}

interface SignatureRequest {
  documentId: string
  requiresSignatures: boolean
  requiredSigners: string[]
  deadline?: Date
  instructions: string
}

// Mock function to get officers who can sign documents
const getOfficers = () => {
  return [
    { id: 'user_1', name: 'John Smith', role: 'Commodore' },
    { id: 'user_2', name: 'Sarah Johnson', role: 'Vice Commodore' },
    { id: 'user_3', name: 'Mike Wilson', role: 'Secretary' },
    { id: 'user_4', name: 'Lisa Brown', role: 'Treasurer' },
    { id: 'user_5', name: 'David Jones', role: 'Race Officer' },
  ]
}

export default function SignatureRequestModal({
  document,
  isOpen,
  onClose,
  onSubmit
}: SignatureRequestModalProps) {
  const { } = useAuth()
  const [formData, setFormData] = useState({
    requiresSignatures: false,
    selectedSigners: [] as string[],
    deadline: '',
    instructions: ''
  })
  const [officers] = useState(getOfficers())

  useEffect(() => {
    if (document && isOpen) {
      setFormData({
        requiresSignatures: document.requiresSignatures,
        selectedSigners: document.signatures.map(sig => sig.userId),
        deadline: document.signatureDeadline ? format(document.signatureDeadline, 'yyyy-MM-dd') : '',
        instructions: ''
      })
    }
  }, [document, isOpen])

  if (!isOpen || !document) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.requiresSignatures && formData.selectedSigners.length === 0) {
      alert('Please select at least one signer')
      return
    }

    const request: SignatureRequest = {
      documentId: document.id,
      requiresSignatures: formData.requiresSignatures,
      requiredSigners: formData.selectedSigners,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      instructions: formData.instructions
    }

    onSubmit(request)
    onClose()
  }

  const handleSignerToggle = (signerId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSigners: prev.selectedSigners.includes(signerId)
        ? prev.selectedSigners.filter(id => id !== signerId)
        : [...prev.selectedSigners, signerId]
    }))
  }

  const handleRequiresSignaturesChange = (requires: boolean) => {
    setFormData(prev => ({
      ...prev,
      requiresSignatures: requires,
      selectedSigners: requires ? prev.selectedSigners : []
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Signature Request</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {document.name}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Requires Signatures Toggle */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.requiresSignatures}
                  onChange={(e) => handleRequiresSignaturesChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This document requires digital signatures
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Enable this to require officer signatures before the document is finalized
              </p>
            </div>

            {/* Signers Selection */}
            {formData.requiresSignatures && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Required Signers
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {officers.map(officer => (
                    <label
                      key={officer.id}
                      className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedSigners.includes(officer.id)}
                        onChange={() => handleSignerToggle(officer.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {officer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {officer.role}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.selectedSigners.length} signer{formData.selectedSigners.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Signature Deadline */}
            {formData.requiresSignatures && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature Deadline (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank for no deadline
                </p>
              </div>
            )}

            {/* Signature Instructions */}
            {formData.requiresSignatures && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for Signers
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optional instructions for signers (e.g., 'Please review section 3 carefully before signing')"
                />
              </div>
            )}

            {/* Current Status */}
            {document.requiresSignatures && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Current Signature Status
                </h4>
                <div className="text-sm text-blue-800">
                  <p>Signatures collected: {document.signatures.length}</p>
                  {document.signatureDeadline && (
                    <p>Deadline: {format(document.signatureDeadline, 'MMMM d, yyyy')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {formData.requiresSignatures && formData.selectedSigners.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Request Summary
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• {formData.selectedSigners.length} signer{formData.selectedSigners.length !== 1 ? 's' : ''} will be notified</p>
                  <p>• {formData.deadline ? `Deadline: ${format(new Date(formData.deadline), 'MMMM d, yyyy')}` : 'No deadline set'}</p>
                  <p>• Document will be locked until all signatures are collected</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {formData.requiresSignatures ? 'Send Signature Request' : 'Update Document'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}