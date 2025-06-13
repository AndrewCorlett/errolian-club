import type { Expense, Settlement } from '@/types/expenses'
import { calculateUserBalance } from '@/types/expenses'
import { getUserById } from '@/data/mockUsers'

export const mockExpenses: Expense[] = [
  {
    id: 'e1',
    title: 'Blue Mountains Train Tickets',
    description: 'Return train tickets for the hiking trip',
    amount: 150,
    currency: 'AUD',
    category: 'transport',
    status: 'approved',
    eventId: '1',
    paidBy: '2', // James Crawford
    participants: [
      { userId: '1', shareAmount: 25, isPaid: true, paidAt: new Date('2024-06-20T10:00:00') },
      { userId: '2', shareAmount: 25, isPaid: true, paidAt: new Date('2024-06-15T14:00:00') },
      { userId: '3', shareAmount: 25, isPaid: false },
      { userId: '4', shareAmount: 25, isPaid: true, paidAt: new Date('2024-06-18T16:30:00') },
      { userId: '5', shareAmount: 25, isPaid: false },
      { userId: '6', shareAmount: 25, isPaid: true, paidAt: new Date('2024-06-22T09:15:00') }
    ],
    createdAt: new Date('2024-06-15T14:00:00'),
    updatedAt: new Date('2024-06-22T09:15:00')
  },
  {
    id: 'e2',
    title: 'Camping Ground Fees',
    description: 'Overnight camping fees for Blue Mountains trip',
    amount: 210,
    currency: 'AUD',
    category: 'accommodation',
    status: 'pending',
    eventId: '1',
    paidBy: '1', // Sarah Wellington
    participants: [
      { userId: '1', shareAmount: 35, isPaid: true, paidAt: new Date('2024-06-25T12:00:00') },
      { userId: '2', shareAmount: 35, isPaid: false },
      { userId: '3', shareAmount: 35, isPaid: false },
      { userId: '4', shareAmount: 35, isPaid: true, paidAt: new Date('2024-06-26T15:20:00') },
      { userId: '5', shareAmount: 35, isPaid: false },
      { userId: '6', shareAmount: 35, isPaid: false }
    ],
    createdAt: new Date('2024-06-25T12:00:00'),
    updatedAt: new Date('2024-06-26T15:20:00')
  },
  {
    id: 'e3',
    title: 'Rock Climbing Equipment Rental',
    description: 'Harnesses, helmets, and shoes for climbing workshop',
    amount: 240,
    currency: 'AUD',
    category: 'equipment',
    status: 'approved',
    eventId: '3',
    paidBy: '3', // Alice Parker
    participants: [
      { userId: '5', shareAmount: 60, isPaid: true, paidAt: new Date('2024-06-28T11:00:00') },
      { userId: '6', shareAmount: 60, isPaid: false },
      { userId: '7', shareAmount: 60, isPaid: false },
      { userId: '8', shareAmount: 60, isPaid: true, paidAt: new Date('2024-06-29T14:45:00') }
    ],
    createdAt: new Date('2024-06-27T10:00:00'),
    updatedAt: new Date('2024-06-29T14:45:00')
  },
  {
    id: 'e4',
    title: 'Coffee & Snacks',
    description: 'Coffee and snacks for monthly meeting',
    amount: 45,
    currency: 'AUD',
    category: 'food',
    status: 'settled',
    eventId: '2',
    paidBy: '4', // Mike Chen
    participants: [
      { userId: '1', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') },
      { userId: '2', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') },
      { userId: '3', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') },
      { userId: '4', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-05T19:00:00') },
      { userId: '5', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') },
      { userId: '7', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') },
      { userId: '8', shareAmount: 5.63, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') },
      { userId: '10', shareAmount: 5.59, isPaid: true, paidAt: new Date('2024-07-06T09:00:00') }
    ],
    createdAt: new Date('2024-07-05T19:30:00'),
    updatedAt: new Date('2024-07-06T09:00:00'),
    settledAt: new Date('2024-07-06T09:00:00')
  },
  {
    id: 'e5',
    title: 'Kayak Rental Deposit',
    description: 'Advance deposit for kayak rental - Jervis Bay trip',
    amount: 500,
    currency: 'AUD',
    category: 'equipment',
    status: 'draft',
    eventId: '5',
    paidBy: '2', // James Crawford
    participants: [
      { userId: '1', shareAmount: 100, isPaid: false },
      { userId: '2', shareAmount: 100, isPaid: true, paidAt: new Date('2024-07-01T10:00:00') },
      { userId: '4', shareAmount: 100, isPaid: false },
      { userId: '6', shareAmount: 100, isPaid: false },
      { userId: '10', shareAmount: 100, isPaid: false }
    ],
    createdAt: new Date('2024-07-01T10:00:00'),
    updatedAt: new Date('2024-07-01T10:00:00')
  }
]

export const mockSettlements: Settlement[] = [
  {
    id: 's1',
    fromUserId: '1',
    toUserId: '4',
    amount: 5.63,
    expenseIds: ['e4'],
    createdAt: new Date('2024-07-06T09:00:00'),
    settledAt: new Date('2024-07-06T09:00:00'),
    isSettled: true
  }
]

export function getExpenseById(id: string): Expense | undefined {
  return mockExpenses.find(expense => expense.id === id)
}

export function getExpensesByEvent(eventId: string): Expense[] {
  return mockExpenses.filter(expense => expense.eventId === eventId)
}

export function getUserExpenses(userId: string): Expense[] {
  return mockExpenses.filter(expense => 
    expense.paidBy === userId || 
    expense.participants.some(p => p.userId === userId)
  )
}

export function getPendingExpenses(): Expense[] {
  return mockExpenses.filter(expense => expense.status === 'pending' || expense.status === 'approved')
}

export function getUserBalance(userId: string, eventId?: string) {
  const relevantExpenses = eventId 
    ? mockExpenses.filter(expense => expense.eventId === eventId)
    : mockExpenses
  return calculateUserBalance(relevantExpenses, userId)
}

export function getUserBalances() {
  const userIds = ['1', '2', '3', '4', '5', '6', '7', '8', '10']
  return userIds.map(userId => getUserBalance(userId))
}

// Enhanced n-1 optimal settlement algorithm
export function calculateOptimalSettlements(): Settlement[] {
  const balances = getUserBalances()
  const settlements: Settlement[] = []
  
  // Filter out users with zero balance for efficiency
  const creditors = balances
    .filter(b => b.netBalance > 0.01) // Use small threshold to handle floating point precision
    .sort((a, b) => b.netBalance - a.netBalance)
  
  const debtors = balances
    .filter(b => b.netBalance < -0.01) // Use small threshold to handle floating point precision
    .sort((a, b) => a.netBalance - b.netBalance)
  
  // Early return if no settlements needed
  if (creditors.length === 0 || debtors.length === 0) {
    return settlements
  }
  
  let settlementId = 1
  
  // Greedy algorithm for optimal n-1 settlements
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0]
    const debtor = debtors[0]
    
    const settleAmount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance))
    
    // Only create settlement if amount is significant (avoid penny transfers)
    if (settleAmount >= 0.01) {
      // Find relevant expense IDs for this settlement
      const relevantExpenseIds = getRelevantExpenseIds(debtor.userId, creditor.userId)
      
      settlements.push({
        id: `opt_s${settlementId++}`,
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100, // Round to nearest cent
        expenseIds: relevantExpenseIds,
        createdAt: new Date(),
        isSettled: false
      })
      
      creditor.netBalance -= settleAmount
      debtor.netBalance += settleAmount
    }
    
    // Remove users with zero balance (within small threshold)
    if (Math.abs(creditor.netBalance) < 0.01) creditors.shift()
    if (Math.abs(debtor.netBalance) < 0.01) debtors.shift()
  }
  
  return settlements
}

// Helper function to find relevant expenses between two users
function getRelevantExpenseIds(debtorId: string, creditorId: string): string[] {
  return mockExpenses
    .filter(expense => {
      // Find expenses where debtor owes creditor money
      const debtorParticipant = expense.participants.find(p => p.userId === debtorId)
      const isCreditorPayer = expense.paidBy === creditorId
      
      return debtorParticipant && !debtorParticipant.isPaid && isCreditorPayer && expense.status !== 'settled'
    })
    .map(expense => expense.id)
}

// Function to process a settlement and update expense statuses
export function processSettlement(settlement: Settlement): boolean {
  try {
    // Find the settlement in mockSettlements and mark as settled
    const existingSettlement = mockSettlements.find(s => s.id === settlement.id)
    if (existingSettlement) {
      existingSettlement.isSettled = true
      existingSettlement.settledAt = new Date()
    } else {
      // Add new settlement record
      mockSettlements.push({
        ...settlement,
        isSettled: true,
        settledAt: new Date()
      })
    }
    
    // Update related expenses to mark participant as paid
    settlement.expenseIds.forEach(expenseId => {
      const expense = mockExpenses.find(e => e.id === expenseId)
      if (expense) {
        const participant = expense.participants.find(p => p.userId === settlement.fromUserId)
        if (participant) {
          participant.isPaid = true
          participant.paidAt = new Date()
        }
        
        // Check if all participants have paid, if so mark expense as settled
        const allPaid = expense.participants.every(p => p.isPaid || p.userId === expense.paidBy)
        if (allPaid && expense.status !== 'settled') {
          expense.status = 'settled'
          expense.settledAt = new Date()
        }
        
        expense.updatedAt = new Date()
      }
    })
    
    return true
  } catch (error) {
    console.error('Error processing settlement:', error)
    return false
  }
}

// Advanced function to get settlement suggestions with expense breakdown
export function getSettlementSuggestions(userId: string): Array<Settlement & { description: string, affectedExpenses: string[] }> {
  const allSettlements = calculateOptimalSettlements()
  const userSettlements = allSettlements.filter(s => s.fromUserId === userId || s.toUserId === userId)
  
  return userSettlements.map(settlement => {
    const isOwing = settlement.fromUserId === userId
    const otherUserId = isOwing ? settlement.toUserId : settlement.fromUserId
    const otherUser = getUserById(otherUserId)
    
    const affectedExpenses = settlement.expenseIds.map(id => {
      const expense = getExpenseById(id)
      return expense?.title || 'Unknown expense'
    })
    
    const description = isOwing 
      ? `Pay $${settlement.amount.toFixed(2)} to ${otherUser?.name}`
      : `Receive $${settlement.amount.toFixed(2)} from ${otherUser?.name}`
    
    return {
      ...settlement,
      description,
      affectedExpenses
    }
  })
}

// Function to validate expense data integrity
export function validateExpenseIntegrity(expense: Expense): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // Check basic required fields
  if (!expense.title?.trim()) errors.push('Title is required')
  if (!expense.amount || expense.amount <= 0) errors.push('Amount must be greater than 0')
  if (!expense.paidBy) errors.push('Paid by user is required')
  if (!expense.participants || expense.participants.length === 0) errors.push('At least one participant is required')
  
  // Check participant share amounts
  const totalShares = expense.participants.reduce((sum, p) => sum + p.shareAmount, 0)
  const amountDiff = Math.abs(totalShares - expense.amount)
  if (amountDiff > 0.01) errors.push(`Participant shares (${totalShares.toFixed(2)}) don't equal total amount (${expense.amount.toFixed(2)})`)
  
  // Check that payer is marked as paid
  const payerParticipant = expense.participants.find(p => p.userId === expense.paidBy)
  if (payerParticipant && !payerParticipant.isPaid) {
    errors.push('The person who paid should be marked as paid')
  }
  
  // Check for duplicate participants
  const participantIds = expense.participants.map(p => p.userId)
  const uniqueIds = new Set(participantIds)
  if (participantIds.length !== uniqueIds.size) {
    errors.push('Duplicate participants found')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}