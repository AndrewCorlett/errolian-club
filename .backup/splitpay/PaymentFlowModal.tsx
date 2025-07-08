import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaymentFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentConfirmed: (paymentData: any) => void
  participant?: {
    id: string
    name: string
    initials: string
    amount: number
  }
}

type PaymentStep = 'details' | 'confirmation' | 'success'

interface PaymentMethod {
  id: string
  name: string
  icon: string
  type: 'bank' | 'digital' | 'cash'
}

const paymentMethods: PaymentMethod[] = [
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦', type: 'bank' },
  { id: 'paypal', name: 'PayPal', icon: '💙', type: 'digital' },
  { id: 'venmo', name: 'Venmo', icon: '💸', type: 'digital' },
  { id: 'cash', name: 'Cash', icon: '💵', type: 'cash' },
  { id: 'revolut', name: 'Revolut', icon: '🔄', type: 'digital' },
  { id: 'other', name: 'Other', icon: '💳', type: 'digital' }
]

export default function PaymentFlowModal({ isOpen, onClose, onPaymentConfirmed, participant }: PaymentFlowModalProps) {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('details')
  const [paymentData, setPaymentData] = useState({
    amount: participant?.amount || 0,
    method: '',
    reference: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  if (!isOpen || !participant) return null

  const handlePaymentMethodSelect = (methodId: string) => {
    setPaymentData(prev => ({ ...prev, method: methodId }))
  }

  const handleContinue = () => {
    if (currentStep === 'details' && paymentData.method && paymentData.amount > 0) {
      setCurrentStep('confirmation')
    } else if (currentStep === 'confirmation') {
      setCurrentStep('success')
      // Simulate payment processing
      setTimeout(() => {
        onPaymentConfirmed({
          ...paymentData,
          participantId: participant.id,
          timestamp: new Date().toISOString()
        })
        handleClose()
      }, 2000)
    }
  }

  const handleClose = () => {
    setCurrentStep('details')
    setPaymentData({
      amount: participant?.amount || 0,
      method: '',
      reference: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    onClose()
  }

  const selectedMethod = paymentMethods.find(m => m.id === paymentData.method)
  const isDetailsValid = paymentData.method && paymentData.amount > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-royal-700">
                {participant.initials}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-royal-900">Pay {participant.name}</h2>
              <p className="text-sm text-accent-600">£{Math.abs(participant.amount).toFixed(2)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors text-primary-600 hover:text-primary-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-primary-100">
          <div className="flex items-center gap-2">
            {['details', 'confirmation', 'success'].map((step, index) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-royal-600 text-white' 
                    : index < ['details', 'confirmation', 'success'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-200 text-primary-600'
                }`}>
                  {index < ['details', 'confirmation', 'success'].indexOf(currentStep) ? '✓' : index + 1}
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 rounded-full transition-colors ${
                    index < ['details', 'confirmation', 'success'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-primary-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-primary-600">
            <span>Details</span>
            <span>Confirm</span>
            <span>Done</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'details' && (
            <div className="space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 font-medium">
                    £
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="pl-8 border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        paymentData.method === method.id
                          ? 'border-royal-500 bg-royal-50'
                          : 'border-primary-200 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs font-medium text-royal-900">{method.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Reference (Optional)
                </label>
                <Input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Payment reference"
                  className="border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Payment Date
                </label>
                <Input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, date: e.target.value }))}
                  className="border-primary-200 focus:border-royal-500 focus:ring-royal-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-royal-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:border-royal-500 focus:ring-royal-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 'confirmation' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="text-4xl mb-2">💳</div>
                <h3 className="text-xl font-bold text-royal-900 mb-2">Confirm Payment</h3>
                <p className="text-accent-600">Review your payment details</p>
              </div>

              <div className="bg-primary-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-primary-700">Amount:</span>
                  <span className="font-semibold text-royal-900">£{paymentData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Method:</span>
                  <span className="font-semibold text-royal-900">
                    {selectedMethod?.icon} {selectedMethod?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Date:</span>
                  <span className="font-semibold text-royal-900">
                    {new Date(paymentData.date).toLocaleDateString()}
                  </span>
                </div>
                {paymentData.reference && (
                  <div className="flex justify-between">
                    <span className="text-primary-700">Reference:</span>
                    <span className="font-semibold text-royal-900">{paymentData.reference}</span>
                  </div>
                )}
                {paymentData.notes && (
                  <div>
                    <span className="text-primary-700">Notes:</span>
                    <p className="text-royal-900 mt-1">{paymentData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-royal-900">Payment Recorded!</h3>
              <p className="text-accent-600">
                Your payment of £{paymentData.amount.toFixed(2)} to {participant.name} has been recorded.
              </p>
              <div className="animate-spin w-6 h-6 border-2 border-royal-200 border-t-royal-600 rounded-full mx-auto"></div>
            </div>
          )}
        </div>

        {/* Footer */}
        {currentStep !== 'success' && (
          <div className="border-t border-primary-100 p-6 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="border-primary-300 text-primary-700 hover:bg-primary-50"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleContinue}
              disabled={!isDetailsValid}
              className="bg-royal-600 hover:bg-royal-700 text-white"
            >
              {currentStep === 'details' ? 'Continue' : 'Confirm Payment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}