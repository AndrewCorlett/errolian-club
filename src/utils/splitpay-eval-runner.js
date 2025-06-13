/**
 * Split-Pay System Evaluation Runner
 * 
 * This script can be run in the browser console to evaluate the split-pay system
 * functionality and validate that all components are working correctly.
 */

import { 
  mockExpenses, 
  getUserBalance, 
  calculateOptimalSettlements,
  processSettlement,
  getSettlementSuggestions,
  validateExpenseIntegrity
} from '../data/mockExpenses.js';
import { calculateUserBalance } from '../types/expenses.js';

export function runSplitPaySystemEvaluation() {
  console.log('🧪 Starting Split-Pay System Evaluation...\n');
  
  const results = {
    testResults: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errors: []
  };

  // Test 1: Balance Calculation
  try {
    console.log('📊 Testing Balance Calculations...');
    const user1Balance = getUserBalance('1');
    const user2Balance = getUserBalance('2');
    
    if (typeof user1Balance.netBalance === 'number' && 
        typeof user2Balance.netBalance === 'number') {
      results.testResults.push('✅ Balance calculation works');
      results.passedTests++;
    } else {
      results.testResults.push('❌ Balance calculation failed');
      results.failedTests++;
    }
    results.totalTests++;
    
    console.log(`User 1 Balance: ${user1Balance.netBalance}`);
    console.log(`User 2 Balance: ${user2Balance.netBalance}`);
  } catch (error) {
    results.testResults.push('❌ Balance calculation threw error');
    results.errors.push(error.message);
    results.failedTests++;
    results.totalTests++;
  }

  // Test 2: Settlement Algorithm
  try {
    console.log('\n💰 Testing Settlement Algorithm...');
    const settlements = calculateOptimalSettlements();
    
    if (Array.isArray(settlements)) {
      results.testResults.push('✅ Settlement algorithm returns array');
      results.passedTests++;
      
      // Test n-1 rule (should have at most n-1 settlements for n users with non-zero balance)
      const nonZeroBalances = ['1', '2', '3', '4', '5', '6', '7', '8', '10']
        .map(id => getUserBalance(id))
        .filter(b => Math.abs(b.netBalance) > 0.01);
      
      if (settlements.length <= Math.max(0, nonZeroBalances.length - 1)) {
        results.testResults.push('✅ Settlement algorithm follows n-1 rule');
        results.passedTests++;
      } else {
        results.testResults.push('❌ Settlement algorithm violates n-1 rule');
        results.failedTests++;
      }
      results.totalTests++;
      
    } else {
      results.testResults.push('❌ Settlement algorithm failed');
      results.failedTests++;
    }
    results.totalTests++;
    
    console.log(`Generated ${settlements.length} optimal settlements`);
    settlements.forEach((s, i) => {
      console.log(`${i + 1}. ${s.fromUserId} → ${s.toUserId}: $${s.amount.toFixed(2)}`);
    });
  } catch (error) {
    results.testResults.push('❌ Settlement algorithm threw error');
    results.errors.push(error.message);
    results.failedTests++;
    results.totalTests++;
  }

  // Test 3: Expense Validation
  try {
    console.log('\n📋 Testing Expense Validation...');
    const testExpense = {
      id: 'test_validation',
      title: 'Test Expense',
      amount: 100,
      currency: 'AUD',
      category: 'food',
      status: 'pending',
      paidBy: '1',
      participants: [
        { userId: '1', shareAmount: 50, isPaid: true },
        { userId: '2', shareAmount: 50, isPaid: false }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const validation = validateExpenseIntegrity(testExpense);
    
    if (validation.isValid) {
      results.testResults.push('✅ Valid expense passes validation');
      results.passedTests++;
    } else {
      results.testResults.push('❌ Valid expense fails validation');
      results.failedTests++;
    }
    results.totalTests++;
    
    // Test invalid expense
    const invalidExpense = {
      ...testExpense,
      participants: [
        { userId: '1', shareAmount: 30, isPaid: true },
        { userId: '2', shareAmount: 50, isPaid: false } // Total is 80, not 100
      ]
    };
    
    const invalidValidation = validateExpenseIntegrity(invalidExpense);
    
    if (!invalidValidation.isValid) {
      results.testResults.push('✅ Invalid expense fails validation');
      results.passedTests++;
    } else {
      results.testResults.push('❌ Invalid expense passes validation');
      results.failedTests++;
    }
    results.totalTests++;
    
    console.log(`Valid expense validation: ${validation.isValid}`);
    console.log(`Invalid expense validation: ${invalidValidation.isValid} (should be false)`);
  } catch (error) {
    results.testResults.push('❌ Expense validation threw error');
    results.errors.push(error.message);
    results.failedTests++;
    results.totalTests++;
  }

  // Test 4: Settlement Suggestions
  try {
    console.log('\n💡 Testing Settlement Suggestions...');
    const suggestions = getSettlementSuggestions('1');
    
    if (Array.isArray(suggestions)) {
      results.testResults.push('✅ Settlement suggestions work');
      results.passedTests++;
      
      // Check if suggestions have proper structure
      const hasProperStructure = suggestions.every(s => 
        s.description && Array.isArray(s.affectedExpenses)
      );
      
      if (hasProperStructure) {
        results.testResults.push('✅ Settlement suggestions have proper structure');
        results.passedTests++;
      } else {
        results.testResults.push('❌ Settlement suggestions missing properties');
        results.failedTests++;
      }
      results.totalTests++;
      
    } else {
      results.testResults.push('❌ Settlement suggestions failed');
      results.failedTests++;
    }
    results.totalTests++;
    
    console.log(`Found ${suggestions.length} settlement suggestions for user 1`);
    suggestions.forEach((s, i) => {
      console.log(`${i + 1}. ${s.description} (${s.affectedExpenses.length} expenses)`);
    });
  } catch (error) {
    results.testResults.push('❌ Settlement suggestions threw error');
    results.errors.push(error.message);
    results.failedTests++;
    results.totalTests++;
  }

  // Test 5: Edge Cases
  try {
    console.log('\n🔄 Testing Edge Cases...');
    
    // Test empty expenses
    const emptyBalance = calculateUserBalance([], 'unknown_user');
    if (emptyBalance.netBalance === 0) {
      results.testResults.push('✅ Empty expenses handled correctly');
      results.passedTests++;
    } else {
      results.testResults.push('❌ Empty expenses not handled correctly');
      results.failedTests++;
    }
    results.totalTests++;
    
    // Test zero amount expense
    const zeroExpense = {
      id: 'zero_test',
      title: 'Zero Amount',
      amount: 0,
      currency: 'AUD',
      category: 'other',
      status: 'draft',
      paidBy: '1',
      participants: [{ userId: '1', shareAmount: 0, isPaid: true }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const zeroValidation = validateExpenseIntegrity(zeroExpense);
    if (!zeroValidation.isValid) {
      results.testResults.push('✅ Zero amount expense validation works');
      results.passedTests++;
    } else {
      results.testResults.push('❌ Zero amount expense should be invalid');
      results.failedTests++;
    }
    results.totalTests++;
    
    console.log('Edge case testing completed');
  } catch (error) {
    results.testResults.push('❌ Edge case testing threw error');
    results.errors.push(error.message);
    results.failedTests++;
    results.totalTests++;
  }

  // Test 6: Performance Test with Mock Data
  try {
    console.log('\n⚡ Testing Performance...');
    const startTime = performance.now();
    
    // Run multiple balance calculations
    for (let i = 0; i < 100; i++) {
      getUserBalance('1');
      calculateOptimalSettlements();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration < 1000) { // Should complete in under 1 second
      results.testResults.push('✅ Performance test passed (< 1s for 100 iterations)');
      results.passedTests++;
    } else {
      results.testResults.push('❌ Performance test failed (> 1s for 100 iterations)');
      results.failedTests++;
    }
    results.totalTests++;
    
    console.log(`Performance test: ${duration.toFixed(2)}ms for 100 iterations`);
  } catch (error) {
    results.testResults.push('❌ Performance test threw error');
    results.errors.push(error.message);
    results.failedTests++;
    results.totalTests++;
  }

  // Generate Final Report
  console.log('\n📋 EVALUATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passedTests}`);
  console.log(`Failed: ${results.failedTests}`);
  console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📊 DETAILED RESULTS:');
  results.testResults.forEach(result => console.log(result));
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`- ${error}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  const overallSuccess = results.failedTests === 0;
  console.log(overallSuccess ? 
    '✅ All tests passed! Split-Pay system is working correctly.' :
    '❌ Some tests failed. Please review the implementation.'
  );
  
  return results;
}

// Export for use in browser console or testing framework
if (typeof window !== 'undefined') {
  window.runSplitPayEvaluation = runSplitPaySystemEvaluation;
}

export default runSplitPaySystemEvaluation;