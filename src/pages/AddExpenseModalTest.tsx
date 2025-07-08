import { useState } from 'react'
import { Button } from '@/components/ui/button'
import AddExpenseModalRedesigned from '@/components/splitpay/AddExpenseModalRedesigned'

export default function AddExpenseModalTest() {
  const [showModal, setShowModal] = useState(false)

  const handleExpenseCreate = (expense: any) => {
    console.log('Expense created:', expense)
    alert(`Expense "${expense.title}" created for £${expense.amount}`)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50 to-royal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-xl font-semibold text-royal-700">Add Expense Modal Test</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center space-y-6">
          <div className="text-6xl">💳</div>
          <h2 className="text-2xl font-bold text-royal-900">Test Add Expense Modal</h2>
          <p className="text-accent-600 max-w-md">
            Click the button below to test the redesigned Add Expense modal with proper theming and functionality.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            data-testid="open-modal-button"
            className="bg-royal-600 hover:bg-royal-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
          >
            Open Add Expense Modal
          </Button>
        </div>
      </div>

      {/* Modal */}
      <AddExpenseModalRedesigned
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onExpenseCreate={handleExpenseCreate}
      />
    </div>
  )
}