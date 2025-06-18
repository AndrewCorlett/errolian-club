/**
 * Cash Flow Optimization Library
 * 
 * This module implements algorithms to optimize debt settlement among multiple parties.
 * The goal is to minimize the number of transactions needed to settle all debts.
 */

export interface Debt {
  fromUserId: string
  toUserId: string
  amount: number
}

export interface UserBalance {
  userId: string
  netAmount: number // Positive = owed money, Negative = owes money
}

export interface OptimizedTransfer {
  fromUserId: string
  toUserId: string
  amount: number
  description: string
}

/**
 * Calculate net balances for all users from a list of debts
 */
export function calculateNetBalances(debts: Debt[]): UserBalance[] {
  const balanceMap = new Map<string, number>()

  // Initialize all users
  debts.forEach(debt => {
    if (!balanceMap.has(debt.fromUserId)) balanceMap.set(debt.fromUserId, 0)
    if (!balanceMap.has(debt.toUserId)) balanceMap.set(debt.toUserId, 0)
  })

  // Calculate net balances
  debts.forEach(debt => {
    const fromBalance = balanceMap.get(debt.fromUserId) || 0
    const toBalance = balanceMap.get(debt.toUserId) || 0
    
    balanceMap.set(debt.fromUserId, fromBalance - debt.amount) // Owes money
    balanceMap.set(debt.toUserId, toBalance + debt.amount)     // Owed money
  })

  return Array.from(balanceMap.entries()).map(([userId, netAmount]) => ({
    userId,
    netAmount
  }))
}

/**
 * Optimize debt settlement using a greedy algorithm
 * This reduces the number of transactions needed to settle all debts
 */
export function optimizeSettlement(debts: Debt[]): OptimizedTransfer[] {
  const balances = calculateNetBalances(debts)
  const creditors = balances.filter(b => b.netAmount > 0).sort((a, b) => b.netAmount - a.netAmount)
  const debtors = balances.filter(b => b.netAmount < 0).sort((a, b) => a.netAmount - b.netAmount)
  
  const transfers: OptimizedTransfer[] = []
  
  let creditorIndex = 0
  let debtorIndex = 0
  
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]
    
    // Calculate transfer amount (minimum of what creditor is owed and what debtor owes)
    const transferAmount = Math.min(creditor.netAmount, Math.abs(debtor.netAmount))
    
    if (transferAmount > 0.01) { // Only create transfer if amount is significant
      transfers.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: transferAmount,
        description: `Settlement transfer of £${transferAmount.toFixed(2)}`
      })
      
      // Update balances
      creditor.netAmount -= transferAmount
      debtor.netAmount += transferAmount
    }
    
    // Move to next creditor or debtor if current one is settled
    if (creditor.netAmount <= 0.01) creditorIndex++
    if (Math.abs(debtor.netAmount) <= 0.01) debtorIndex++
  }
  
  return transfers
}

/**
 * Calculate settlement suggestions for a specific user
 */
export function getSettlementSuggestions(
  userId: string, 
  debts: Debt[], 
  userNames: Map<string, string>
): OptimizedTransfer[] {
  const optimizedTransfers = optimizeSettlement(debts)
  
  // Filter transfers that involve the current user
  return optimizedTransfers
    .filter(transfer => transfer.fromUserId === userId || transfer.toUserId === userId)
    .map(transfer => ({
      ...transfer,
      description: transfer.fromUserId === userId
        ? `Pay £${transfer.amount.toFixed(2)} to ${userNames.get(transfer.toUserId) || 'Unknown User'}`
        : `Receive £${transfer.amount.toFixed(2)} from ${userNames.get(transfer.fromUserId) || 'Unknown User'}`
    }))
}

/**
 * Convert expense data to debt relationships
 */
export function expensesToDebts(expenses: Array<{
  id: string
  amount: number
  paid_by: string
  participants: Array<{
    user_id: string
    share_amount: number
    is_paid: boolean
  }>
}>): Debt[] {
  const debts: Debt[] = []
  
  expenses.forEach(expense => {
    expense.participants.forEach(participant => {
      if (!participant.is_paid && participant.user_id !== expense.paid_by) {
        debts.push({
          fromUserId: participant.user_id,
          toUserId: expense.paid_by,
          amount: participant.share_amount
        })
      }
    })
  })
  
  return debts
}

/**
 * Calculate total debt reduction from optimization
 */
export function calculateOptimizationSavings(originalDebts: Debt[], optimizedTransfers: OptimizedTransfer[]): {
  originalTransactions: number
  optimizedTransactions: number
  transactionReduction: number
  percentageSaved: number
} {
  const originalTransactions = originalDebts.length
  const optimizedTransactions = optimizedTransfers.length
  const transactionReduction = originalTransactions - optimizedTransactions
  const percentageSaved = originalTransactions > 0 ? (transactionReduction / originalTransactions) * 100 : 0
  
  return {
    originalTransactions,
    optimizedTransactions,
    transactionReduction,
    percentageSaved
  }
}

/**
 * Group transfers by user for easier display
 */
export function groupTransfersByUser(transfers: OptimizedTransfer[]): Map<string, {
  outgoing: OptimizedTransfer[]
  incoming: OptimizedTransfer[]
  netAmount: number
}> {
  const userGroups = new Map<string, {
    outgoing: OptimizedTransfer[]
    incoming: OptimizedTransfer[]
    netAmount: number
  }>()
  
  transfers.forEach(transfer => {
    // Initialize user groups if they don't exist
    if (!userGroups.has(transfer.fromUserId)) {
      userGroups.set(transfer.fromUserId, { outgoing: [], incoming: [], netAmount: 0 })
    }
    if (!userGroups.has(transfer.toUserId)) {
      userGroups.set(transfer.toUserId, { outgoing: [], incoming: [], netAmount: 0 })
    }
    
    // Add transfers to respective groups
    const fromGroup = userGroups.get(transfer.fromUserId)!
    const toGroup = userGroups.get(transfer.toUserId)!
    
    fromGroup.outgoing.push(transfer)
    fromGroup.netAmount -= transfer.amount
    
    toGroup.incoming.push(transfer)
    toGroup.netAmount += transfer.amount
  })
  
  return userGroups
}