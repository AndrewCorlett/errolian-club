// Test API integration for expense events
import { expenseEventService } from './src/lib/database.js';

async function testExpenseEventAPI() {
  console.log('🧪 Testing expense event API integration...');
  
  try {
    // Test fetching expense events
    console.log('📋 Fetching expense events...');
    const expenseEvents = await expenseEventService.getExpenseEvents(1, 10);
    console.log('✅ Successfully fetched expense events:', expenseEvents);
    
    // Test creating a new expense event
    console.log('➕ Creating new expense event...');
    const newExpenseEvent = await expenseEventService.createExpenseEvent({
      title: 'Test Event - Frontend API',
      description: 'Testing frontend API integration',
      location: 'Test Location',
      currency: 'GBP',
      createdBy: '0501ea64-3525-41cb-b825-452bb6b551c1',
      participants: ['0501ea64-3525-41cb-b825-452bb6b551c1']
    });
    
    console.log('✅ Successfully created expense event:', newExpenseEvent);
    
    // Test fetching the specific expense event
    console.log('🔍 Fetching created expense event...');
    const fetchedEvent = await expenseEventService.getExpenseEvent(newExpenseEvent.id);
    console.log('✅ Successfully fetched expense event details:', fetchedEvent);
    
    return { success: true, eventId: newExpenseEvent.id };
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testExpenseEventAPI()
  .then(result => {
    if (result.success) {
      console.log('🎉 All API tests passed! Event ID:', result.eventId);
    } else {
      console.error('💥 API tests failed:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });