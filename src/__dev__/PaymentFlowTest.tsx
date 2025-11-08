import { useState } from 'react'
import { Button } from '@/components/ui/button'
import PaymentFlowModal from '@/components/splitpay/PaymentFlowModal'

const mockParticipants = [
  {
    id: 'p1',
    name: 'Callum Forsyth',
    initials: 'CF',
    amount: -122.05 // Amount you owe
  },
  {
    id: 'p2', 
    name: 'Daniel Corrigan',
    initials: 'DC',
    amount: 26.39 // Amount they owe you
  },
  {
    id: 'p3',
    name: 'Patrick Montgomery', 
    initials: 'PM',
    amount: -76.38 // Amount you owe
  }
]

export default function PaymentFlowTest() {
  const [showModal, setShowModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<typeof mockParticipants[0] | null>(null)

  const handlePayParticipant = (participant: typeof mockParticipants[0]) => {
    setSelectedParticipant(participant)
    setShowModal(true)
  }

  const handlePaymentConfirmed = (paymentData: any) => {
    console.log('Payment confirmed:', paymentData)
    alert(`Payment of £${paymentData.amount} to ${selectedParticipant?.name} recorded successfully!`)
    setShowModal(false)
    setSelectedParticipant(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-semibold text-royal-700">Payment Flow Test</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">💸</div>
          <h2 className="text-2xl font-bold text-royal-900 mb-2">Test Payment Flow</h2>
          <p className="text-accent-600">
            Click on any participant below to test the payment confirmation interface.
          </p>
        </div>

        {/* Participants List */}
        <div className="space-y-3">
          {mockParticipants.map((participant) => (
            <div
              key={participant.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-royal-700">
                        {participant.initials}
                      </span>
                    </div>
                    {/* Status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      participant.amount < 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                  <div>
                    <div className="font-semibold text-royal-900">
                      {participant.name}
                    </div>
                    <div className="text-sm text-primary-600">
                      {participant.amount < 0 ? 'You owe' : 'Owes you'}: £{Math.abs(participant.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${
                    participant.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {participant.amount < 0 ? '-' : '+'}£{Math.abs(participant.amount).toFixed(2)}
                  </div>
                  
                  {participant.amount < 0 && (
                    <Button
                      onClick={() => handlePayParticipant(participant)}
                      data-testid={`pay-button-${participant.id}`}
                      size="sm"
                      className="bg-royal-600 hover:bg-royal-700 text-white ml-2"
                    >
                      Pay
                    </Button>
                  )}
                  
                  {participant.amount > 0 && (
                    <Button
                      onClick={() => console.log('Request payment from', participant.name)}
                      size="sm"
                      variant="outline"
                      className="border-primary-300 text-primary-700 hover:bg-primary-50 ml-2"
                    >
                      Request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-4 border border-primary-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">ℹ️</span>
            <span className="text-sm font-medium text-royal-700">Test Instructions</span>
          </div>
          <ul className="text-sm text-primary-600 space-y-1">
            <li>• Click "Pay" buttons to test payment flow</li>
            <li>• Red indicators = You owe money</li>
            <li>• Green indicators = They owe you money</li>
            <li>• Payment flow includes method selection and confirmation</li>
          </ul>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentFlowModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedParticipant(null)
        }}
        onPaymentConfirmed={handlePaymentConfirmed}
        participant={selectedParticipant || undefined}
      />
    </div>
  )
}